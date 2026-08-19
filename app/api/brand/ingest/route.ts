import { NextResponse } from "next/server";
import { z } from "zod";
import { crawlCompanyWebsite, scrapeInstagramProfile } from "@/lib/integrations/apify";
import { analyzeBrandMaterial } from "@/lib/integrations/brand-analyzer";

export const runtime = "nodejs";
export const maxDuration = 180;

const inputSchema = z.object({
  websiteUrl: z.url(),
  instagramUsername: z.string().trim().min(1).max(64).optional(),
});

export async function POST(request: Request) {
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados de marca inválidos.", details: parsed.error.flatten() }, { status: 400 });
  }

  if (!process.env.APIFY_API_TOKEN) {
    return NextResponse.json({ error: "Apify não configurado." }, { status: 503 });
  }

  try {
    const [website, instagram] = await Promise.all([
      crawlCompanyWebsite(parsed.data.websiteUrl),
      parsed.data.instagramUsername ? scrapeInstagramProfile(parsed.data.instagramUsername) : Promise.resolve([]),
    ]);

    if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) {
      return NextResponse.json({ website, instagram, analysis: null, mode: "sources-only" });
    }

    const brandbook = await analyzeBrandMaterial({
      websiteUrl: parsed.data.websiteUrl,
      instagramHandle: parsed.data.instagramUsername,
      website,
      instagram,
    });

    return NextResponse.json({
      website,
      instagram,
      ...brandbook,
      mode: "live",
    });
  } catch (error) {
    console.error("crIA brand ingestion failed", error);
    return NextResponse.json({ error: "Não foi possível analisar as fontes agora." }, { status: 502 });
  }
}
