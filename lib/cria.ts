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
  { id: "product-main", name: "Produto principal", kind: "product", icon: "▧", accent: "yellow" },
  { id: "logo-main", name: "Logo principal", kind: "logo", icon: "M", accent: "orange" },
  { id: "product-second", name: "Segundo produto", kind: "product", icon: "◇", accent: "cyan" },
  { id: "gift-kit", name: "Kit de produtos", kind: "product", icon: "◇", accent: "blue" },
  { id: "logo-mono", name: "Logo monocromático", kind: "logo", icon: "◉", accent: "cyan" },
  { id: "instagram-ref", name: "Referência do Instagram", kind: "reference", icon: "◎", accent: "orange" },
];

export const initialCampaign: CampaignResult = {
  title: "Campanha da sua marca",
  rationale: "Uma ideia objetiva para apresentar o principal benefício da marca e convidar o público para a próxima ação.",
  caption: "Uma novidade pensada para quem procura uma escolha local, clara e feita com atenção aos detalhes. Conheça a marca e descubra o que ela preparou para você.",
  hashtags: ["#NegocioLocal", "#Novidade", "#SuaMarca"],
  pieces: {
    story: { eyebrow: "novidade", headline: "tem coisa boa chegando.", cta: "saiba mais" },
    carousel: [
      { title: "feito por perto", body: "para pessoas de verdade." },
      { title: "uma escolha clara", body: "com benefício concreto." },
      { title: "conheça a novidade", body: "fale com a marca." },
    ],
    post: { eyebrow: "lançamento", headline: "uma novidade por aqui.", cta: "conheça a marca" },
  },
};

export const formatMeta: Record<ContentFormat, { label: string; detail: string; symbol: string; count: string }> = {
  campaign: { label: "campanha", detail: "todos os formatos", symbol: "✦", count: "5 peças" },
  story: { label: "story", detail: "rápido e vertical", symbol: "9:16", count: "1 peça" },
  carousel: { label: "carrossel", detail: "3 ideias conectadas", symbol: "3×", count: "3 peças" },
  post: { label: "post", detail: "uma ideia forte", symbol: "1:1", count: "1 peça" },
};
