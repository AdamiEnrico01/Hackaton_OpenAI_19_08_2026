import { NextResponse } from "next/server";
import { z } from "zod";
import { crawlCompanyWebsite, scrapeInstagramProfile } from "@/lib/integrations/apify";
import { analyzeBrandMaterial } from "@/lib/integrations/brand-analyzer";
import { protectPaidApi, readLimitedJson, safeErrorName } from "@/lib/security/api-access";
import { isSafePublicHttpUrl } from "@/lib/security/public-url";

export const runtime = "nodejs";
export const maxDuration = 90;

async function directWebsiteFallback(url: string) {
  const response = await fetch(url, { headers: { "User-Agent": "crIA-brand-reader/1.0" }, signal: AbortSignal.timeout(12_000), cache: "no-store" });
  if (!response.ok) throw new Error(`site respondeu ${response.status}`);
  const html = await response.text();
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return [{ source: "website-direct", url, title: text.slice(0, 5000) }];
}

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

    let website = websiteResult.status === "fulfilled" ? websiteResult.value : [];
    if (websiteResult.status === "rejected") {
      try { website = await directWebsiteFallback(parsed.data.websiteUrl); } catch { /* both collectors unavailable */ }
    }
    const instagram = instagramResult?.status === "fulfilled" ? instagramResult.value : [];
    const warnings = [
      ...(websiteResult.status === "rejected" ? ["Não foi possível coletar o site."] : []),
      ...(instagramResult?.status === "rejected" ? ["Não foi possível coletar o Instagram."] : []),
    ];

    if (website.length === 0 && (!instagramResult || instagramResult.status === "rejected")) {
      website = [{ source: "url-context", url: parsed.data.websiteUrl, note: "A coleta automática falhou. Faça uma análise provisória baseada na URL e no nome do domínio, sem inventar evidências." }];
      warnings.push("Coleta automática indisponível; análise provisória gerada pelo modelo.");
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
