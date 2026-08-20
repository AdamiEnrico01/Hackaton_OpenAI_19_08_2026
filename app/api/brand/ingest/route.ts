import { NextResponse } from "next/server";
import { z } from "zod";
import { scrapeInstagramProfile } from "@/lib/integrations/apify";
import { analyzeBrandMaterial } from "@/lib/integrations/brand-analyzer";
import { protectPaidApi, readLimitedJson, safeErrorName } from "@/lib/security/api-access";
import { isSafePublicHttpUrl } from "@/lib/security/public-url";

export const runtime = "nodejs";
export const maxDuration = 90;
const brandCache = new Map<string, { expiresAt: number; payload: Record<string, unknown> }>();
const BRAND_CACHE_TTL_MS = 30 * 60 * 1000;

async function directWebsiteFallback(url: string) {
  const response = await fetch(url, { headers: { "User-Agent": "crIA-brand-reader/1.0" }, signal: AbortSignal.timeout(12_000), cache: "no-store" });
  if (!response.ok) throw new Error(`site respondeu ${response.status}`);
  const html = await response.text();
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const images = Array.from(html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi), (match) => new URL(match[1], url).href).slice(0, 24);
  const links = Array.from(html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi), (match) => new URL(match[1], url).href).filter((link) => link.startsWith("http")).slice(0, 40);
  return [{ source: "website-direct", url, text: text.slice(0, 12_000), images, links }];
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

  const cacheKey = `${parsed.data.websiteUrl.toLowerCase()}|${parsed.data.instagramUsername?.toLowerCase() ?? ""}`;
  const cached = brandCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return NextResponse.json({ ...cached.payload, cached: true });

  try {
    let website: Record<string, unknown>[] = [];
    let websiteUsedFallback = false;
    try { website = await directWebsiteFallback(parsed.data.websiteUrl); } catch { websiteUsedFallback = true; }
    let instagram: Record<string, unknown>[] = [];
    let instagramFailed = false;
    if (parsed.data.instagramUsername && process.env.APIFY_API_TOKEN) {
      try { instagram = await scrapeInstagramProfile(parsed.data.instagramUsername); } catch { instagramFailed = true; }
    }
    const warnings = [
      ...(websiteUsedFallback && website.length === 0 ? ["Não foi possível coletar o site; o modelo usou apenas o endereço informado."] : []),
      ...(instagramFailed ? ["Não foi possível coletar o Instagram."] : []),
    ];

    if (website.length === 0 && instagram.length === 0) {
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

    const payload = {
      website,
      instagram,
      ...brandbook,
      warnings,
      mode: "live",
    };
    brandCache.set(cacheKey, { expiresAt: Date.now() + BRAND_CACHE_TTL_MS, payload });
    return NextResponse.json(payload);
  } catch (error) {
    console.error("crIA brand ingestion failed", { error: safeErrorName(error) });
    return NextResponse.json({ error: "Não foi possível analisar as fontes agora." }, { status: 502 });
  }
}
