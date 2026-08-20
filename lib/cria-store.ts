"use client";

import { useEffect, useState } from "react";

export type BrandProfile = {
  companyName: string;
  segment: string;
  audience: string;
  tone: string[];
  primaryColor: string;
  secondaryColors: string[];
  positioning: string;
  products: Array<{ name: string; imageUrl?: string; sourceUrl?: string }>;
  logoUrls: string[];
  contentPillars: string[];
  avoid: string[];
  websiteUrl?: string;
  instagramHandle?: string;
};

export type CampaignCopy = {
  title: string;
  rationale?: string;
  caption: string;
  hashtags: string[];
};

export type SavedCreation = {
  id: string;
  createdAt: string;
  format: "post" | "story";
  prompt: string;
  image: string;
  campaign: CampaignCopy;
  brandName: string;
};

const BRAND_KEY = "cria-brand-analysis";
const LIBRARY_KEY = "cria-library";

export const emptyBrand: BrandProfile = {
  companyName: "Sua marca",
  segment: "Negócio local",
  audience: "Pessoas interessadas nos produtos e serviços da marca.",
  tone: ["Próxima", "Clara"],
  primaryColor: "#1952d1",
  secondaryColors: ["#ffdb5c", "#f5f3ee"],
  positioning: "Uma marca próxima, útil e coerente com o seu público.",
  products: [],
  logoUrls: [],
  contentPillars: ["Produtos", "Bastidores", "Relacionamento"],
  avoid: ["Promessas exageradas", "Clichês"],
};

function parseBrand(raw: string | null): BrandProfile {
  if (!raw) return emptyBrand;
  try {
    const saved = JSON.parse(raw) as { analysis?: Partial<BrandProfile>; websiteUrl?: string; instagramHandle?: string } | Partial<BrandProfile>;
    const analysis = "analysis" in saved ? saved.analysis : saved;
    return { ...emptyBrand, ...analysis, websiteUrl: saved.websiteUrl ?? analysis?.websiteUrl, instagramHandle: saved.instagramHandle ?? analysis?.instagramHandle };
  } catch {
    return emptyBrand;
  }
}

export function readBrand() {
  if (typeof window === "undefined") return emptyBrand;
  return parseBrand(window.localStorage.getItem(BRAND_KEY));
}

export function saveBrand(brand: BrandProfile) {
  window.localStorage.setItem(BRAND_KEY, JSON.stringify({ analysis: brand, websiteUrl: brand.websiteUrl, instagramHandle: brand.instagramHandle, mode: "local" }));
  window.dispatchEvent(new Event("cria-brand-change"));
}

export function useBrand() {
  const [brand, setBrand] = useState<BrandProfile>(emptyBrand);
  useEffect(() => {
    const refresh = () => setBrand(readBrand());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("cria-brand-change", refresh);
    return () => { window.removeEventListener("storage", refresh); window.removeEventListener("cria-brand-change", refresh); };
  }, []);
  return brand;
}

export function readLibrary(): SavedCreation[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(LIBRARY_KEY) ?? "[]") as SavedCreation[]; } catch { return []; }
}

export function saveCreation(creation: SavedCreation) {
  const current = readLibrary();
  window.localStorage.setItem(LIBRARY_KEY, JSON.stringify([creation, ...current.filter((item) => item.id !== creation.id)].slice(0, 24)));
  window.dispatchEvent(new Event("cria-library-change"));
}

export function useLibrary() {
  const [items, setItems] = useState<SavedCreation[]>([]);
  useEffect(() => {
    const refresh = () => setItems(readLibrary());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("cria-library-change", refresh);
    return () => { window.removeEventListener("storage", refresh); window.removeEventListener("cria-library-change", refresh); };
  }, []);
  return items;
}

export function brandBrief(brand: BrandProfile) {
  return [
    `Marca: ${brand.companyName}.`,
    `Segmento: ${brand.segment}.`,
    `Público: ${brand.audience}.`,
    `Posicionamento: ${brand.positioning}.`,
    `Tom: ${brand.tone.join(", ")}.`,
    `Cores: ${[brand.primaryColor, ...brand.secondaryColors].join(", ")}.`,
    brand.products.length ? `Produtos reais: ${brand.products.map((product) => product.name).join(", ")}.` : "",
    `Evitar: ${brand.avoid.join(", ")}.`,
  ].filter(Boolean).join("\n");
}
