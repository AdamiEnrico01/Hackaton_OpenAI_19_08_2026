"use client";

import Link from "next/link";
import { useState } from "react";
import { ProductSidebar } from "@/components/product-pages";

type StudioState = "empty" | "working" | "ready";

export function ImageStudio() {
  const [prompt, setPrompt] = useState("");
  const [state, setState] = useState<StudioState>("empty");
  const [format, setFormat] = useState<"post" | "story">("post");
  const [assetsOpen, setAssetsOpen] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const assets = [{ name: "Café Aurora 500g", kind: "produto", icon: "☕", tone: "yellow" }, { name: "Logo principal", kind: "identidade", icon: "A", tone: "orange" }, { name: "Kit presente", kind: "produto", icon: "◇", tone: "blue" }, { name: "Referência do Instagram", kind: "referência", icon: "◎", tone: "cyan" }];

  async function createImage() {
    if (!prompt.trim() || state === "working") return;
    setState("working");
    try {
      const response = await fetch("/api/generate/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, format }) });
      if (!response.ok) throw new Error("image unavailable");
    } catch {
      // The visual result remains a polished local preview while credentials are absent.
    } finally {
      setTimeout(() => setState("ready"), 700);
    }
  }

  const hasPrompt = Boolean(prompt.trim());

  return (
    <main className={`cria-image-studio is-${state}`}><ProductSidebar active="Criar" />
      <header className="cria-image-header"><Link href="/" className="cria-landing-mark"><span className="cria-mark-dot" /><span>cr<span>IA</span></span></Link><div className="cria-image-context"><span className="cria-online-dot" /> Empório Aurora <b>/</b> criar</div><Link className="cria-close-studio" href="/">sair <span>×</span></Link></header>
      <section className="cria-image-workspace">
        {state === "empty" ? <div className="cria-image-welcome"><p className="cria-kicker"><i /> estúdio de criação</p><h1>Olá, <em>Empório.</em></h1><p>O que vamos colocar no mundo hoje?</p></div> : null}
        {state !== "empty" ? <div className={`cria-generated-stage ${state === "working" ? "is-loading" : ""}`}><div className="cria-generated-media"><div className="cria-generated-art"><span className="cria-generated-orb cria-generated-orb-a" /><span className="cria-generated-orb cria-generated-orb-b" /><span className="cria-generated-grain" /><div className="cria-generated-label">empório aurora <small>dia dos pais · 2026</small></div><div className="cria-generated-title">O melhor<br /><em>presente</em><br />é estar perto.</div><div className="cria-generated-product"><span>☕</span><b>CAFÉ<br />AURORA</b><small>especial</small></div><div className="cria-generated-cta">para quem faz parte da sua história →</div></div><div className="cria-generated-meta"><span>{format === "post" ? "Post quadrado · 1080 × 1080" : "Story vertical · 1080 × 1920"}</span><button type="button">↗ abrir em tela cheia</button></div></div><aside className="cria-instagram-caption"><div className="cria-caption-account"><span className="cria-caption-avatar">A</span><span><b>emporioaurora</b><small>Empório Aurora</small></span><button type="button">•••</button></div><p>O melhor presente é estar perto. Neste Dia dos Pais, celebre as histórias que continuam sendo passadas de xícara em xícara. ☕</p><div className="cria-caption-actions"><span>♡</span><span>◌</span><span>⌁</span><b>♡</b></div><span className="cria-caption-likes">42 curtidas</span><p className="cria-caption-hashtags">#DiaDosPais #CafeAurora #PresenteComAfeto #EmporioAurora</p><small className="cria-caption-time">agora mesmo</small></aside></div> : <div className="cria-empty-mark"><span className="cria-empty-spark">✦</span><span className="cria-empty-line" /></div>}
        <div className={`cria-image-composer ${state !== "empty" ? "is-docked" : ""}`}>{assetsOpen ? <div className="cria-asset-popover"><div><strong>Adicionar à criação</strong><button type="button" onClick={() => setAssetsOpen(false)}>×</button></div><small>Use ativos salvos para a crIA manter sua marca presente.</small>{assets.map((asset) => <button type="button" className={selectedAssets.includes(asset.name) ? "is-selected" : ""} key={asset.name} onClick={() => setSelectedAssets((current) => current.includes(asset.name) ? current.filter((name) => name !== asset.name) : [...current, asset.name])}><span className={`cria-asset-mini is-${asset.tone}`}>{asset.icon}</span><span><b>{asset.name}</b><small>{asset.kind}</small></span><i>{selectedAssets.includes(asset.name) ? "✓" : "+"}</i></button>)}</div> : null}<div className="cria-composer-top"><button type="button" className={`cria-add-context ${assetsOpen ? "is-active" : ""}`} onClick={() => setAssetsOpen((open) => !open)} aria-label="Adicionar produto, logo ou referência" aria-expanded={assetsOpen}>+</button><span className="cria-chat-avatar">✦</span><span>{state === "empty" ? "Converse com a crIA" : "Continue refinando"}</span>{selectedAssets.length ? <small className="cria-asset-count">{selectedAssets.length} ativo{selectedAssets.length > 1 ? "s" : ""}</small> : null}<div className="cria-format-switch"><button type="button" className={format === "post" ? "is-active" : ""} onClick={() => setFormat("post")}>1:1</button><button type="button" className={format === "story" ? "is-active" : ""} onClick={() => setFormat("story")}>9:16</button></div></div>{selectedAssets.length ? <div className="cria-attached-assets">{selectedAssets.map((name) => <span key={name}>{name}<button type="button" onClick={() => setSelectedAssets((current) => current.filter((item) => item !== name))} aria-label={`Remover ${name}`}>×</button></span>)}</div> : null}<textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); createImage(); } }} placeholder="Ex.: crie um post para o Dia dos Pais..." aria-label="Descreva a imagem que você quer criar" /><div className="cria-composer-bottom"><span><i /> sua marca está ativa</span><button type="button" onClick={createImage} disabled={!hasPrompt || state === "working"}>{state === "working" ? <><b className="cria-spinner cria-spinner-dark" /> criando...</> : state === "ready" ? <>refazer <b>↗</b></> : <>criar imagem <b>→</b></>}</button></div></div>
        {state === "empty" ? <div className="cria-prompt-suggestions"><span>tente dizer</span><button type="button" onClick={() => setPrompt("crie um post para o Dia dos Pais, acolhedor e com foco em presente")}>post para o Dia dos Pais</button><button type="button" onClick={() => setPrompt("crie um story anunciando o café especial da semana")}>story de lançamento</button></div> : <div className="cria-result-tools"><button type="button">♡ salvar na biblioteca</button><button type="button">editar briefing</button><button type="button" className="is-primary">usar na campanha <span>→</span></button></div>}
      </section>
    </main>
  );
}
