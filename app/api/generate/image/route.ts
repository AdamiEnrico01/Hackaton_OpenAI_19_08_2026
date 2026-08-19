import { generateImage } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { protectPaidApi, readLimitedJson, safeErrorName } from "@/lib/security/api-access";

export const runtime = "nodejs";
export const maxDuration = 120;

const requestSchema = z.object({
  prompt: z.string().trim().min(20).max(6_000),
  format: z.enum(["story", "carousel", "post"]),
}).strict();

export async function POST(request: Request) {
  const accessError = protectPaidApi(request);
  if (accessError) return accessError;

  const body = await readLimitedJson(request);
  if (body.error) return body.error;
  const parsed = requestSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json({ error: "Pedido de imagem inválido.", details: parsed.error.flatten() }, { status: 400 });
  }

  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) {
    return NextResponse.json({ error: "AI Gateway não configurado." }, { status: 503 });
  }

  const model = process.env.CRIA_IMAGE_MODEL ?? "openai/gpt-image-2";
  const aspectRatio = parsed.data.format === "story" ? "9:16" : "1:1";

  try {
    const result = await generateImage({
      model,
      prompt: parsed.data.prompt,
      aspectRatio,
      providerOptions: {
        gateway: {
          tags: ["feature:image", "product:cria", `format:${parsed.data.format}`],
        },
      },
    });

    return NextResponse.json({
      image: `data:${result.image.mediaType};base64,${result.image.base64}`,
      mediaType: result.image.mediaType,
      model,
      usage: result.usage,
    });
  } catch (error) {
    console.error("crIA image generation failed", { error: safeErrorName(error) });
    return NextResponse.json({ error: "Não foi possível gerar a imagem agora." }, { status: 502 });
  }
}
