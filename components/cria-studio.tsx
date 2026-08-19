"use client";

import Image from "next/image";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  availableAssets,
  formatMeta,
  initialCampaign,
  type BrandAsset,
  type CampaignResult,
  type ContentFormat,
} from "@/lib/cria";

const suggestions = [
  { label: "foco no aroma", text: "com foco no aroma e no começo da manhã" },
  { label: "mais acolhedor", text: "em um tom acolhedor e próximo" },
  { label: "CTA para WhatsApp", text: "com uma chamada clara para pedir pelo WhatsApp" },
  { label: "valorize o local", text: "destacando a produção local e artesanal" },
];

const navigation = [
  { label: "Criar", icon: "✦", active: true },
  { label: "Biblioteca", icon: "▦" },
  { label: "Minha marca", icon: "◒" },
  { label: "Planejamento", icon: "⌁" },
];

const mascotUrl = "https://raw.githubusercontent.com/AdamiEnrico01/Hackaton_OpenAI_19_08_2026/11216c62d3a47921e182adbacc1b92c58628e5ce/public/cria-mascot.png";

function copyTextFallback(text: string) {
  const textArea = document.createElement("textarea");
  const activeElement = document.activeElement;

  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.inset = "0 auto auto -9999px";
  textArea.style.opacity = "0";
  textArea.style.pointerEvents = "none";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  textArea.setSelectionRange(0, text.length);

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  } finally {
    textArea.remove();
    if (activeElement instanceof HTMLElement) activeElement.focus({ preventScroll: true });
  }

  return copied;
}

function AssetPill({ asset, onRemove }: { asset: BrandAsset; onRemove?: () => void }) {
  return (
    <span className={`cria-asset-pill cria-accent-${asset.accent}`}>
      <span className="cria-asset-icon" aria-hidden="true">{asset.icon}</span>
      <span>
        <strong>{asset.name}</strong>
        <small>{asset.kind === "product" ? "produto" : asset.kind === "logo" ? "identidade" : "referência"}</small>
      </span>
      {onRemove ? <button type="button" onClick={onRemove} aria-label={`Remover ${asset.name}`}>×</button> : null}
    </span>
  );
}

function ProductPack() {
  return (
    <div className="cria-product-pack" aria-label="Embalagem ilustrativa do Café Aurora">
      <span className="cria-pack-seal">A</span>
      <strong>CAFÉ<br />AURORA</strong>
      <small>especial</small>
    </div>
  );
}

function CreativeCanvas({ variant, campaign }: { variant: "story" | "post"; campaign: CampaignResult }) {
  const content = campaign.pieces[variant];
  return (
    <div className={`cria-creative-canvas cria-canvas-${variant}`}>
      <div className="cria-orbit cria-orbit-one" />
      <div className="cria-orbit cria-orbit-two" />
      <span className="cria-client-logo"><b>A</b> Empório Aurora</span>
      <div className="cria-creative-copy">
        <small>{content.eyebrow}</small>
        <strong>{content.headline}</strong>
        <span>{content.cta} →</span>
      </div>
      <ProductPack />
    </div>
  );
}

function CarouselCanvas({ campaign }: { campaign: CampaignResult }) {
  return (
    <div className="cria-carousel-preview">
      {campaign.pieces.carousel.map((slide, index) => (
        <div className={`cria-carousel-slide cria-slide-${index + 1}`} key={slide.title}>
          <span>0{index + 1}</span>
          <strong>{slide.title}</strong>
          <small>{slide.body}</small>
        </div>
      ))}
    </div>
  );
}

export function CriaStudio() {
  const [format, setFormat] = useState<ContentFormat>("campaign");
  const [activePreview, setActivePreview] = useState<"story" | "carousel" | "post">("story");
  const [assets, setAssets] = useState<BrandAsset[]>(availableAssets.slice(0, 2));
  const [assetDrawerOpen, setAssetDrawerOpen] = useState(false);
  const [prompt, setPrompt] = useState("Crie uma campanha para lançar o Café Aurora Especial nesta sexta. Quero despertar vontade e destacar que a torra é feita aqui na cidade.");
  const [usedSuggestions, setUsedSuggestions] = useState<string[]>([]);
  const [campaign, setCampaign] = useState(initialCampaign);
  const [status, setStatus] = useState<"ready" | "generating" | "done">("ready");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [zoom, setZoom] = useState(72);
  const [notice, setNotice] = useState("");
  const mobileNavRef = useRef<HTMLElement>(null);
  const mobileNavToggleRef = useRef<HTMLButtonElement>(null);

  const remainingAssets = useMemo(
    () => availableAssets.filter((candidate) => !assets.some((asset) => asset.id === candidate.id)),
    [assets],
  );

  useEffect(() => {
    if (!mobileNavOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const bodyPaddingRight = Number.parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;
    const mobileNav = mobileNavRef.current;
    const navToggle = mobileNavToggleRef.current;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${bodyPaddingRight + scrollbarWidth}px`;

    const focusFrame = window.requestAnimationFrame(() => {
      mobileNav?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
    });

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileNavOpen(false);
        return;
      }

      if (event.key !== "Tab") return;
      const focusableElements = Array.from(
        mobileNav?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [],
      );
      if (!focusableElements.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.paddingRight = previousBodyPaddingRight;
      navToggle?.focus({ preventScroll: true });
    };
  }, [mobileNavOpen]);

  function selectFormat(nextFormat: ContentFormat) {
    setFormat(nextFormat);
    if (nextFormat !== "campaign") setActivePreview(nextFormat === "carousel" ? "carousel" : nextFormat);
  }

  function addSuggestion(label: string, text: string) {
    if (usedSuggestions.includes(label)) return;
    const base = prompt.trim().replace(/[.]$/, "");
    setPrompt(`${base}, ${text}.`);
    setUsedSuggestions((current) => [...current, label]);
  }

  async function generateCampaign() {
    if (prompt.trim().length < 12 || status === "generating") return;
    setStatus("generating");
    setNotice("");

    try {
      const response = await fetch("/api/generate/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, format, assetIds: assets.map((asset) => asset.id) }),
      });

      const result = (await response.json().catch(() => null)) as {
        campaign?: CampaignResult;
        error?: string;
        mode?: string;
      } | null;

      if (!response.ok || !result?.campaign) {
        const message = response.status === 401
          ? "Geração live protegida durante os testes. A prévia demonstrativa continua disponível."
          : result?.error ?? "Não foi possível gerar a campanha agora.";
        throw new Error(message);
      }

      setCampaign(result.campaign);
      setStatus("done");
      setNotice(result.mode === "live" ? "Campanha gerada com IA e pronta para revisão." : "Campanha demonstrativa carregada.");
      setActivePreview(format === "post" ? "post" : format === "carousel" ? "carousel" : "story");
    } catch (error) {
      setStatus("ready");
      setNotice(error instanceof Error ? error.message : "Não foi possível gerar a campanha agora.");
    }
  }

  async function copyCaption() {
    const text = `${campaign.caption}\n\n${campaign.hashtags.join(" ")}`;
    let copied = false;

    try {
      if (window.isSecureContext && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        copied = true;
      }
    } catch {
      copied = false;
    }

    if (!copied) copied = copyTextFallback(text);
    setNotice(copied ? "Legenda e hashtags copiadas." : "Não foi possível copiar. Selecione a legenda e tente novamente.");
  }

  function handlePreviewTabKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;

    const tabs = Array.from(
      event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)') ?? [],
    );
    const currentIndex = tabs.indexOf(event.currentTarget);
    if (currentIndex < 0) return;

    event.preventDefault();
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? tabs.length - 1
        : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    tabs[nextIndex]?.focus();
    tabs[nextIndex]?.click();
  }

  const visiblePreviews = format === "campaign" ? ["story", "carousel", "post"] : [format];

  return (
    <div className="cria-app-shell">
      {mobileNavOpen ? <button className="cria-nav-backdrop" type="button" onClick={() => setMobileNavOpen(false)} aria-label="Fechar menu" tabIndex={-1} /> : null}
      <aside
        ref={mobileNavRef}
        id="cria-mobile-navigation"
        className={`cria-sidebar ${mobileNavOpen ? "is-open" : ""}`}
        aria-label="Navegação principal"
        aria-modal={mobileNavOpen || undefined}
        role={mobileNavOpen ? "dialog" : undefined}
      >
        <div className="cria-brand-lockup">
          <span className="cria-logo-symbol"><i /><i /><i /></span>
          <span className="cria-wordmark">cr<span>IA</span><small>seu marketeiro favorito</small></span>
        </div>

        <nav className="cria-navigation">
          <span className="cria-nav-heading">Workspace</span>
          {navigation.map((item) => (
            <button className={item.active ? "is-active" : ""} type="button" key={item.label} onClick={() => {
              setMobileNavOpen(false);
              if (!item.active) setNotice(`${item.label} estará disponível na próxima etapa do produto.`);
            }}>
              <span aria-hidden="true">{item.icon}</span>{item.label}
              {item.active ? <i /> : null}
            </button>
          ))}
        </nav>

        <div className="cria-brand-health">
          <div><span>Marca pronta</span><strong>92%</strong></div>
          <div className="cria-health-track"><i /></div>
          <small>Seu brandbook está guiando todas as criações.</small>
        </div>

        <div className="cria-user">
          <span>EA</span>
          <div><strong>Empório Aurora</strong><small>Plano Essencial</small></div>
          <button type="button" aria-label="Abrir opções do perfil" onClick={() => setNotice("Configurações de perfil estarão disponíveis após ativarmos o Supabase Auth.")}>•••</button>
        </div>
      </aside>

      <main className="cria-main">
        <header className="cria-mobile-header">
          <div className="cria-brand-lockup">
            <span className="cria-logo-symbol"><i /><i /><i /></span>
            <span className="cria-wordmark">cr<span>IA</span></span>
          </div>
          <button ref={mobileNavToggleRef} type="button" onClick={() => setMobileNavOpen((open) => !open)} aria-expanded={mobileNavOpen} aria-controls="cria-mobile-navigation" aria-label={mobileNavOpen ? "Fechar menu" : "Abrir menu"}>{mobileNavOpen ? "×" : "☰"}</button>
        </header>

        <section className="cria-create-panel">
          <div className="cria-topline">
            <span>Estúdio de criação</span>
            <div><i /> identidade da marca ativa</div>
          </div>

          <div className="cria-intro">
            <div>
              <span className="cria-eyebrow">nova criação · 01</span>
              <h1>Sua ideia,<br /><em>pronta para aparecer.</em></h1>
              <p>Conte o que precisa. A crIA combina sua marca, seus produtos e a melhor estrutura para cada canal.</p>
            </div>
            <div className="cria-mascot-stage">
              <span className="cria-speech">Oi! O que vamos<br />colocar no mundo?</span>
              <span className="cria-mascot-glow" />
              <Image src={mascotUrl} alt="Ararinha azul, mascote da crIA" width={240} height={240} priority />
            </div>
          </div>

          <section className="cria-composer" aria-label="Criar novo conteúdo">
            <div className="cria-section-heading">
              <div><span>01</span><div><strong>O que vamos criar?</strong><small>Escolha um formato ou leve a campanha completa.</small></div></div>
              <small>{formatMeta[format].count}</small>
            </div>

            <div className="cria-format-grid">
              {(Object.keys(formatMeta) as ContentFormat[]).map((key) => {
                const item = formatMeta[key];
                return (
                  <button className={`cria-format-option cria-format-${key} ${format === key ? "is-selected" : ""}`} key={key} type="button" onClick={() => selectFormat(key)} aria-pressed={format === key}>
                    <span>{item.symbol}</span>
                    <div><strong>{item.label}</strong><small>{item.detail}</small></div>
                    <i aria-hidden="true">✓</i>
                  </button>
                );
              })}
            </div>

            <div className="cria-divider" />

            <div className="cria-section-heading">
              <div><span>02</span><div><strong>O que precisa aparecer?</strong><small>Use os arquivos encontrados no site e nas redes da empresa.</small></div></div>
              <small>{assets.length} selecionados</small>
            </div>

            <div className="cria-assets-row">
              {assets.map((asset) => <AssetPill key={asset.id} asset={asset} onRemove={() => setAssets((current) => current.filter((item) => item.id !== asset.id))} />)}
              <button className="cria-add-asset" type="button" onClick={() => setAssetDrawerOpen((open) => !open)} aria-expanded={assetDrawerOpen}>
                <span>{assetDrawerOpen ? "×" : "+"}</span><small>{assetDrawerOpen ? "fechar" : "adicionar"}</small>
              </button>
            </div>

            {assetDrawerOpen ? (
              <div className="cria-asset-drawer">
                <div><strong>Arquivos da sua marca</strong><small>Encontrados no site e no Instagram</small></div>
                <div className="cria-asset-options">
                  {remainingAssets.length ? remainingAssets.map((asset) => (
                    <button type="button" key={asset.id} onClick={() => { setAssets((current) => [...current, asset]); setAssetDrawerOpen(false); }}>
                      <span>{asset.icon}</span><div><strong>{asset.name}</strong><small>{asset.kind}</small></div><i>+</i>
                    </button>
                  )) : <p>Todos os arquivos já estão na criação.</p>}
                </div>
              </div>
            ) : null}

            <div className="cria-divider" />

            <div className="cria-section-heading">
              <div><span>03</span><div><strong>Conte sua ideia</strong><small>Escreva naturalmente ou use atalhos para direcionar.</small></div></div>
            </div>

            <div className="cria-suggestions">
              {suggestions.map((suggestion) => (
                <button className={usedSuggestions.includes(suggestion.label) ? "is-used" : ""} type="button" key={suggestion.label} onClick={() => addSuggestion(suggestion.label, suggestion.text)}>
                  <span>{usedSuggestions.includes(suggestion.label) ? "✓" : "+"}</span>{suggestion.label}
                </button>
              ))}
            </div>

            <div className="cria-prompt-box">
              <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} aria-label="Descreva o conteúdo que deseja criar" />
              <div>
                <span><i /> a crIA seguirá o brandbook</span>
                <button type="button" onClick={generateCampaign} disabled={prompt.trim().length < 12 || status === "generating"}>
                  {status === "generating" ? <><b className="cria-spinner" /> criando sua campanha...</> : status === "done" ? <>campanha pronta <b>✓</b></> : <>criar com a crIA <b>→</b></>}
                </button>
              </div>
            </div>
          </section>
        </section>

        <aside className="cria-preview-panel" aria-label="Prévia da criação">
          <div className="cria-preview-header">
            <div><span>Prévia ao vivo</span><i /></div>
            <button type="button" aria-label="Mais opções" onClick={() => setNotice("Mais opções de exportação entrarão na próxima etapa.")}>•••</button>
          </div>

          <div className="cria-preview-title">
            <span>Campanha 001</span>
            <h2>{campaign.title}</h2>
            <p>{campaign.rationale}</p>
          </div>

          <div className="cria-preview-tabs" role="tablist" aria-label="Formatos da campanha">
            {(["story", "carousel", "post"] as const).map((tab) => (
              <button type="button" role="tab" id={`cria-tab-${tab}`} aria-controls="cria-preview-content" aria-selected={activePreview === tab} tabIndex={activePreview === tab ? 0 : -1} className={activePreview === tab ? "is-active" : ""} key={tab} onClick={() => setActivePreview(tab)} onKeyDown={handlePreviewTabKeyDown} disabled={!visiblePreviews.includes(tab)}>
                {tab === "carousel" ? "Carrossel" : tab === "story" ? "Story" : "Post"}
              </button>
            ))}
          </div>

          <div className="cria-preview-stage">
            <div className="cria-stage-tools"><span>{activePreview === "story" ? "1080 × 1920" : "1080 × 1080"}</span><div><button type="button" aria-label="Diminuir zoom" onClick={() => setZoom((value) => Math.max(56, value - 8))} disabled={zoom === 56}>−</button><b>{zoom}%</b><button type="button" aria-label="Aumentar zoom" onClick={() => setZoom((value) => Math.min(88, value + 8))} disabled={zoom === 88}>+</button></div></div>
            <div id="cria-preview-content" className={`cria-artboard-wrap is-${activePreview}`} style={{ "--cria-preview-scale": zoom / 72 } as CSSProperties} role="tabpanel" aria-labelledby={`cria-tab-${activePreview}`}>
              {activePreview === "carousel" ? <CarouselCanvas campaign={campaign} /> : <CreativeCanvas variant={activePreview} campaign={campaign} />}
            </div>
          </div>

          <div className="cria-caption-panel">
            <div><strong>Legenda sugerida</strong><button type="button" onClick={copyCaption}>copiar</button></div>
            <p>{campaign.caption}</p>
            <span>{campaign.hashtags.join(" ")}</span>
            <small className="cria-notice" role="status" aria-live="polite">{notice}</small>
          </div>

          <div className="cria-preview-actions">
            <button type="button" onClick={() => setNotice("Persistência de rascunhos será ativada com o Supabase.")}>Salvar rascunho</button>
            <button type="button" onClick={() => setNotice("O fluxo de revisão será ativado com a persistência de campanhas.")}>Revisar campanha <span>→</span></button>
          </div>
        </aside>
      </main>
    </div>
  );
}
