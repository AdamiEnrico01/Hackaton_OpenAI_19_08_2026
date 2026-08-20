import { generateText, Output } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { initialCampaign } from "@/lib/cria";
import { protectPaidApi, readLimitedJson, safeErrorName } from "@/lib/security/api-access";

export const runtime = "nodejs";
export const maxDuration = 60;

const requestSchema = z.object({
  prompt: z.string().trim().min(12).max(4_000),
  format: z.enum(["campaign", "story", "carousel", "post"]),
  assetIds: z.array(z.string().regex(/^[A-Za-z0-9_-]{1,80}$/)).max(12).default([]),
}).strict();

const campaignSchema = z.object({
  title: z.string().min(2).max(80),
  rationale: z.string().min(12).max(320),
  caption: z.string().min(20).max(2_200),
  hashtags: z.array(z.string().trim().regex(/^#[\p{L}\p{N}_]{2,40}$/u)).min(3).max(10),
  pieces: z.object({
    story: z.object({ eyebrow: z.string(), headline: z.string(), cta: z.string() }),
    carousel: z.array(z.object({ title: z.string(), body: z.string() })).length(3),
    post: z.object({ eyebrow: z.string(), headline: z.string(), cta: z.string() }),
  }),
});

function hasGatewayCredentials() {
  return Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN);
}

export async function POST(request: Request) {
  const accessError = protectPaidApi(request);
  if (accessError) return accessError;

  const body = await readLimitedJson(request);
  if (body.error) return body.error;
  const parsed = requestSchema.safeParse(body.data);

  if (!parsed.success) {
    return NextResponse.json({ error: "Pedido inválido.", details: parsed.error.flatten() }, { status: 400 });
  }

  if (!hasGatewayCredentials()) {
    return NextResponse.json({ campaign: initialCampaign, mode: "demo" });
  }

  const { prompt, format, assetIds } = parsed.data;
  const model = process.env.CRIA_TEXT_MODEL ?? "openai/gpt-5.6-luna";

  try {
    const result = await generateText({
      model,
      output: Output.object({ schema: campaignSchema }),
      system: [
        "Você é a crIA, uma estrategista de marketing para pequenos negócios brasileiros.",
        "Crie conteúdo objetivo, humano e comercial sem clichês, promessas exageradas ou hashtags genéricas.",
        "O conceito deve funcionar como story, carrossel de exatamente 3 páginas e post.",
        "Preserve nomes de produtos, detalhes locais e chamadas para ação fornecidos pelo usuário.",
        "Nunca invente o nome da empresa, produtos, preços, condições, localização ou credenciais que não estejam no briefing.",
        "Evite fórmulas gastas como feito com carinho, momento especial, do seu jeito, transforme sua rotina, experiência única, vem conferir, você merece e dar o primeiro passo.",
        "Prefira benefícios e ações concretas sustentadas pelo briefing; quando faltar um detalhe, seja conciso em vez de preencher com abstrações.",
        "Hashtags devem começar com um único # e conter somente letras, números ou underscore, sem espaços, hífens ou pontuação.",
      ].join(" "),
      prompt: [
        `Formato solicitado: ${format}.`,
        `Briefing do usuário: ${prompt}`,
        `Ativos selecionados: ${assetIds.join(", ") || "nenhum"}.`,
        "O briefing pode conter um brandbook operacional. Use esses fatos como contexto da marca e não invente informações ausentes.",
      ].join("\n"),
      providerOptions: {
        gateway: {
          user: "cria-mvp",
          tags: ["feature:campaign", "product:cria", `format:${format}`],
        },
      },
    });

    return NextResponse.json({ campaign: result.output, mode: "live", model });
  } catch (error) {
    console.error("crIA campaign generation failed", { error: safeErrorName(error) });
    return NextResponse.json({ error: "Não foi possível gerar a campanha agora." }, { status: 502 });
  }
}
