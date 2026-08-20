"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ProductSidebar } from "@/components/product-pages";
import { brandBrief, CampaignCopy, saveCreation, useBrand } from "@/lib/cria-store";

type StudioState = "empty" | "working" | "ready" | "error";

function handleFor(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "suamarca";
}

async function makeLibraryPreview(source: string) {
  const image = new window.Image();
  image.src = source;
  await image.decode();
  const scale = Math.min(1, 900 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.naturalWidth * scale);
  canvas.height = Math.round(image.naturalHeight * scale);
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", .76);
}

export function ImageStudio() {
  const brand = useBrand();
  const [prompt, setPrompt] = useState("");
  const [state, setState] = useState<StudioState>("empty");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<CampaignCopy | null>(null);
  const [notice, setNotice] = useState("");
  const [format, setFormat] = useState<"post" | "story">("post");
  const [assetsOpen, setAssetsOpen] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const assets = useMemo(() => {
    const products = brand.products.slice(0, 4).map((product) => ({ name: product.name, kind: "produto", icon: "◇", tone: "yellow" }));
    const logo = { name: "Logo da marca", kind: "identidade", icon: brand.companyName.charAt(0).toUpperCase(), tone: "orange" };
    return products.length ? [logo, ...products] : [logo, { name: "Referência do website", kind: "referência", icon: "◎", tone: "cyan" }];
  }, [brand]);

  async function createImage() {
    if (!prompt.trim() || state === "working") return;
    setState("working");
    setNotice("");
    const context = `${brandBrief(brand)}\nAtivos escolhidos: ${selectedAssets.join(", ") || "nenhum"}.\nPedido: ${prompt.trim()}`;
    try {
      const [imageResponse, campaignResponse] = await Promise.all([
        fetch("/api/generate/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: context, format }) }),
        fetch("/api/generate/campaign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: context,
            format,
            assetIds: selectedAssets.map((asset) => asset.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 80)),
          }),
        }),
      ]);
      const imageResult = await imageResponse.json().catch(() => null) as { image?: string; error?: string } | null;
      const campaignResult = await campaignResponse.json().catch(() => null) as { campaign?: CampaignCopy; error?: string } | null;
      if (!imageResponse.ok || !imageResult?.image) throw new Error(imageResult?.error ?? "Não foi possível gerar a imagem agora.");
      if (!campaignResponse.ok || !campaignResult?.campaign) throw new Error(campaignResult?.error ?? "A imagem foi criada, mas a legenda não ficou pronta.");
      setGeneratedImage(imageResult.image);
      setCampaign(campaignResult.campaign);
      setState("ready");
    } catch (error) {
      setState("error");
      setNotice(error instanceof Error ? error.message : "Não foi possível gerar a criação agora.");
    }
  }

  async function saveToLibrary() {
    if (!generatedImage || !campaign) return;
    try {
      const preview = await makeLibraryPreview(generatedImage);
      saveCreation({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), format, prompt, image: preview, campaign, brandName: brand.companyName });
      setNotice("Criação salva na biblioteca ✓");
    } catch {
      setNotice("Não foi possível salvar no navegador. Tente limpar uma criação antiga.");
    }
  }

  const hasPrompt = prompt.trim().length >= 3;
  const account = handleFor(brand.companyName);
  const initials = brand.companyName.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase();

  return (
    <main className={`cria-image-studio is-${state}`}><ProductSidebar active="Criar" />
      <header className="cria-image-header"><Link href="/" className="cria-landing-mark"><Image src="/cria-icon-v2.png" alt="" width={30} height={30} /><span>cr<span>IA</span></span></Link><div className="cria-image-context"><span className="cria-online-dot" /> {brand.companyName} <b>/</b> criar</div><Link className="cria-close-studio" href="/">sair <span>×</span></Link></header>
      <nav className="cria-studio-mobile-nav"><Link className="is-active" href="/studio">Criar</Link><Link href="/library">Biblioteca</Link><Link href="/brand">Marca</Link><Link href="/planning">Planejamento</Link></nav>
      <section className="cria-image-workspace">
        {state === "empty" || state === "error" ? <div className="cria-image-welcome"><p className="cria-kicker"><i /> estúdio de criação</p><h1>Olá, <em>{brand.companyName === "Sua marca" ? "vamos criar." : brand.companyName}</em></h1><p>O que vamos colocar no mundo hoje?</p></div> : null}
        {state === "working" || state === "ready" ? <div className={`cria-generated-stage ${state === "working" ? "is-loading" : ""}`}><div className={`cria-generated-media is-${format}`}><div className="cria-generated-art">{generatedImage ? <Image src={generatedImage} alt={`Imagem gerada para ${brand.companyName}`} fill sizes="(max-width: 760px) 90vw, 560px" unoptimized style={{ objectFit: "cover", zIndex: 5 }} /> : <div className="cria-generation-placeholder"><b className="cria-spinner cria-spinner-dark" /><span>Criando com o brandbook de {brand.companyName}…</span></div>}</div><div className="cria-generated-meta"><span>{format === "post" ? "Post quadrado · 1024 × 1024" : "Story vertical · 1024 × 1536"}</span><button type="button" onClick={() => generatedImage && window.open(generatedImage, "_blank", "noopener,noreferrer")} disabled={!generatedImage}>↗ abrir em tela cheia</button></div></div><aside className="cria-instagram-caption"><div className="cria-caption-account"><span className="cria-caption-avatar">{initials}</span><span><b>{account}</b><small>{brand.companyName}</small></span><button type="button" aria-label="Mais opções">•••</button></div><p>{campaign?.caption ?? "A crIA está escrevendo uma legenda coerente com a voz da sua marca…"}</p><div className="cria-caption-actions"><span>♡</span><span>◌</span><span>⌁</span><b>♡</b></div><span className="cria-caption-likes">prévia da publicação</span><p className="cria-caption-hashtags">{campaign?.hashtags.join(" ")}</p><small className="cria-caption-time">agora mesmo</small></aside></div> : <div className="cria-empty-mark"><span className="cria-empty-spark">✦</span><span className="cria-empty-line" /></div>}
        <div className={`cria-image-composer ${state === "working" || state === "ready" ? "is-docked" : ""}`}>{assetsOpen ? <div className="cria-asset-popover"><div><strong>Adicionar à criação</strong><button type="button" onClick={() => setAssetsOpen(false)}>×</button></div><small>Esses ativos entram no briefing enviado à IA.</small>{assets.map((asset) => <button type="button" className={selectedAssets.includes(asset.name) ? "is-selected" : ""} key={asset.name} onClick={() => setSelectedAssets((current) => current.includes(asset.name) ? current.filter((name) => name !== asset.name) : [...current, asset.name])}><span className={`cria-asset-mini is-${asset.tone}`}>{asset.icon}</span><span><b>{asset.name}</b><small>{asset.kind}</small></span><i>{selectedAssets.includes(asset.name) ? "✓" : "+"}</i></button>)}</div> : null}<div className="cria-composer-top"><button type="button" className={`cria-add-context ${assetsOpen ? "is-active" : ""}`} onClick={() => setAssetsOpen((open) => !open)} aria-label="Adicionar produto, logo ou referência" aria-expanded={assetsOpen}>+</button><span className="cria-chat-avatar">✦</span><span>{state === "empty" || state === "error" ? "Converse com a crIA" : "Continue refinando"}</span>{selectedAssets.length ? <small className="cria-asset-count">{selectedAssets.length} ativo{selectedAssets.length > 1 ? "s" : ""}</small> : null}<div className="cria-format-switch"><button type="button" className={format === "post" ? "is-active" : ""} onClick={() => setFormat("post")}>1:1</button><button type="button" className={format === "story" ? "is-active" : ""} onClick={() => setFormat("story")}>9:16</button></div></div>{selectedAssets.length ? <div className="cria-attached-assets">{selectedAssets.map((name) => <span key={name}>{name}<button type="button" onClick={() => setSelectedAssets((current) => current.filter((item) => item !== name))} aria-label={`Remover ${name}`}>×</button></span>)}</div> : null}<textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); createImage(); } }} placeholder={`Ex.: crie um post para ${brand.companyName}...`} aria-label="Descreva a imagem que você quer criar" /><div className="cria-composer-bottom"><span><i /> {brand.companyName === "Sua marca" ? "adicione sua marca no onboarding" : `${brand.companyName} está ativa`}</span><button type="button" onClick={createImage} disabled={!hasPrompt || state === "working"}>{state === "working" ? <><b className="cria-spinner cria-spinner-dark" /> criando...</> : state === "ready" ? <>refazer <b>↗</b></> : <>criar imagem <b>→</b></>}</button></div></div>
        {state === "empty" ? <div className="cria-prompt-suggestions"><span>tente dizer</span><button type="button" onClick={() => setPrompt("crie um post apresentando nosso produto mais importante")}>apresentar um produto</button><button type="button" onClick={() => setPrompt("crie um story com uma oferta para esta semana")}>story de oferta</button></div> : state === "ready" ? <div className="cria-result-tools"><button type="button" onClick={() => void saveToLibrary()}>♡ salvar na biblioteca</button><button type="button" onClick={() => { setState("empty"); setNotice(""); }}>editar briefing</button><button type="button" className="is-primary" onClick={() => void saveToLibrary()}>usar na campanha <span>→</span></button></div> : notice ? <p className="cria-image-notice" role="status" aria-live="polite">{notice}</p> : null}
        {notice && state === "ready" ? <p className="cria-image-notice" role="status" aria-live="polite">{notice}</p> : null}
      </section>
    </main>
  );
}
