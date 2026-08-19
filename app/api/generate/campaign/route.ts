import { generateText, Output } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { initialCampaign } from "@/lib/cria";

export const runtime = "nodejs";
export const maxDuration = 60;

const requestSchema = z.object({
  prompt: z.string().trim().min(12).max(4_000),
  format: z.enum(["campaign", "story", "carousel", "post"]),
  assetIds: z.array(z.string().min(1)).max(12).default([]),
});

const campaignSchema = z.object({
  title: z.string().min(2).max(80),
  rationale: z.string().min(12).max(320),
  caption: z.string().min(20).max(2_200),
  hashtags: z.array(z.string().regex(/^#/)).min(3).max(10),
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
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));

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
      ].join(" "),
      prompt: [
        `Formato solicitado: ${format}.`,
        `Briefing do usuário: ${prompt}`,
        `Ativos selecionados: ${assetIds.join(", ") || "nenhum"}.`,
        "Marca de demonstração: Empório Aurora; tom acolhedor, próximo e confiante; público local; cores azul, amarelo e laranja.",
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
    console.error("crIA campaign generation failed", error);
    return NextResponse.json({ campaign: initialCampaign, mode: "fallback" });
  }
}
