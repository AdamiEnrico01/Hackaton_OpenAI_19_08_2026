export type ContentFormat = "campaign" | "story" | "carousel" | "post";

export type BrandAsset = {
  id: string;
  name: string;
  kind: "product" | "logo" | "reference";
  icon: string;
  accent: "yellow" | "blue" | "cyan" | "orange";
};

export type CampaignResult = {
  title: string;
  rationale: string;
  caption: string;
  hashtags: string[];
  pieces: {
    story: { eyebrow: string; headline: string; cta: string };
    carousel: Array<{ title: string; body: string }>;
    post: { eyebrow: string; headline: string; cta: string };
  };
};

export const availableAssets: BrandAsset[] = [
  { id: "coffee-500", name: "Café Aurora 500g", kind: "product", icon: "▧", accent: "yellow" },
  { id: "logo-main", name: "Logo principal", kind: "logo", icon: "A", accent: "orange" },
  { id: "coffee-250", name: "Café Aurora 250g", kind: "product", icon: "☕", accent: "cyan" },
  { id: "gift-kit", name: "Kit presente", kind: "product", icon: "◇", accent: "blue" },
  { id: "logo-mono", name: "Logo monocromático", kind: "logo", icon: "◉", accent: "cyan" },
  { id: "instagram-ref", name: "Referência do Instagram", kind: "reference", icon: "◎", accent: "orange" },
];

export const initialCampaign: CampaignResult = {
  title: "Café Aurora Especial",
  rationale: "A campanha aproxima o produto da rotina local e transforma a torra fresca no principal motivo para experimentar.",
  caption: "Tem novidade sendo torrada por aqui. O Café Aurora Especial nasce na nossa cidade e chega fresco à sua xícara — com aroma marcante, doçura equilibrada e aquele convite para começar o dia sem pressa. Disponível a partir desta sexta.",
  hashtags: ["#CafeEspecial", "#TorraLocal", "#EmporioAurora", "#CompreLocal", "#CafeFresco"],
  pieces: {
    story: { eyebrow: "torra local · lote novo", headline: "sua manhã pede algo especial.", cta: "peça pelo WhatsApp" },
    carousel: [
      { title: "da nossa cidade", body: "para a sua xícara." },
      { title: "torra fresca", body: "aroma que chega primeiro." },
      { title: "sexta tem lote novo", body: "reserve o seu." },
    ],
    post: { eyebrow: "lançamento · sexta", headline: "café novo por aqui.", cta: "conheça o Aurora Especial" },
  },
};

export const formatMeta: Record<ContentFormat, { label: string; detail: string; symbol: string; count: string }> = {
  campaign: { label: "campanha", detail: "todos os formatos", symbol: "✦", count: "5 peças" },
  story: { label: "story", detail: "rápido e vertical", symbol: "9:16", count: "1 peça" },
  carousel: { label: "carrossel", detail: "3 ideias conectadas", symbol: "3×", count: "3 peças" },
  post: { label: "post", detail: "uma ideia forte", symbol: "1:1", count: "1 peça" },
};
