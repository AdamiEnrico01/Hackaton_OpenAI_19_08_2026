import { NextResponse } from "next/server";
import { z } from "zod";
import { crawlCompanyWebsite, scrapeInstagramProfile } from "@/lib/integrations/apify";
import { analyzeBrandMaterial } from "@/lib/integrations/brand-analyzer";
import { protectPaidApi, readLimitedJson, safeErrorName } from "@/lib/security/api-access";
import { isSafePublicHttpUrl } from "@/lib/security/public-url";

export const runtime = "nodejs";
export const maxDuration = 90;

const inputSchema = z.object({
  websiteUrl: z.url().refine(isSafePublicHttpUrl, "Use uma URL pública HTTP ou HTTPS."),
  instagramUsername: z.string().trim().regex(/^@?[A-Za-z0-9._]{1,30}$/).optional(),
}).strict();

export async function POST(request: Request) {
  const accessError = protectPaidApi(request);
  if (accessError) return accessError;

  const body = await readLimitedJson(request);
  if (body.error) return body.error;
  const parsed = inputSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados de marca inválidos.", details: parsed.error.flatten() }, { status: 400 });
  }

  if (!process.env.APIFY_API_TOKEN) {
    return NextResponse.json({ error: "Apify não configurado." }, { status: 503 });
  }

  try {
    const sourceTasks = [crawlCompanyWebsite(parsed.data.websiteUrl)];
    if (parsed.data.instagramUsername) sourceTasks.push(scrapeInstagramProfile(parsed.data.instagramUsername));
    const [websiteResult, instagramResult] = await Promise.allSettled(sourceTasks);

    const website = websiteResult.status === "fulfilled" ? websiteResult.value : [];
    const instagram = instagramResult?.status === "fulfilled" ? instagramResult.value : [];
    const warnings = [
      ...(websiteResult.status === "rejected" ? ["Não foi possível coletar o site."] : []),
      ...(instagramResult?.status === "rejected" ? ["Não foi possível coletar o Instagram."] : []),
    ];

    if (websiteResult.status === "rejected" && (!instagramResult || instagramResult.status === "rejected")) {
      return NextResponse.json({ error: "Não foi possível coletar as fontes agora." }, { status: 502 });
    }

    if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) {
      return NextResponse.json({ website, instagram, analysis: null, warnings, mode: "sources-only" });
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
      warnings,
      mode: "live",
    });
  } catch (error) {
    console.error("crIA brand ingestion failed", { error: safeErrorName(error) });
    return NextResponse.json({ error: "Não foi possível analisar as fontes agora." }, { status: 502 });
  }
}
