"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BrandProfile, emptyBrand, saveBrand, useBrand, useLibrary } from "@/lib/cria-store";

const nav = [{ href: "/studio", label: "Criar" }, { href: "/library", label: "Biblioteca" }, { href: "/brand", label: "Minha marca" }, { href: "/planning", label: "Planejamento" }];

function initials(name: string) {
  return name.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase();
}

export function ProductSidebar({ active }: { active: string }) {
  const brand = useBrand();
  return <aside className="cria-product-sidebar"><Link href="/" className="cria-sidebar-mark"><Image src="/cria-icon-v2.png" alt="crIA" width={34} height={34} /><span>cr<span>IA</span></span></Link><nav>{nav.map((item, index) => <Link key={item.href} className={active === item.label ? "is-active" : ""} href={item.href}><span>{["✦", "▦", "◒", "⌁"][index]}</span>{item.label}</Link>)}</nav><div className="cria-sidebar-bottom"><div className="cria-sidebar-profile"><span className="cria-profile-initials">{initials(brand.companyName)}</span><div><b>{brand.companyName}</b><small>Marca ativa</small></div><i>•••</i></div></div></aside>;
}

function ProductHeader({ active }: { active: string }) {
  const brand = useBrand();
  return <><ProductSidebar active={active} /><header className="cria-product-header"><Link href="/" className="cria-landing-mark"><Image src="/cria-icon-v2.png" alt="" width={30} height={30} /><span>cr<span>IA</span></span></Link><div className="cria-product-context">{brand.companyName} <b>/</b> {active.toLowerCase()}</div><div className="cria-product-user"><span>{initials(brand.companyName)}</span><b>{brand.companyName}</b></div><nav className="cria-mobile-nav">{nav.map((item) => <Link className={active === item.label ? "is-active" : ""} href={item.href} key={item.href}>{item.label}</Link>)}</nav></header></>;
}

export function LibraryPage() {
  const items = useLibrary();
  const [filter, setFilter] = useState("Tudo");
  const [search, setSearch] = useState("");
  const visible = items.filter((item) => (filter === "Tudo" || item.format === filter.toLowerCase()) && `${item.campaign.title} ${item.prompt}`.toLowerCase().includes(search.toLowerCase()));
  return <main className="cria-product-page"><ProductHeader active="Biblioteca" /><section className="cria-page-inner"><div className="cria-page-heading"><div><p className="cria-kicker"><i /> seu acervo de ideias</p><h1>Biblioteca</h1><p>Criações salvas no estúdio, prontas para consultar e reutilizar.</p></div><Link className="cria-primary-cta" href="/studio">Criar algo novo <span>→</span></Link></div><div className="cria-library-toolbar"><div className="cria-library-filters">{["Tudo", "Post", "Story"].map((item) => <button type="button" className={filter === item ? "is-active" : ""} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div><label className="cria-search">⌕ <input aria-label="Buscar criações" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar criações" /></label></div>{visible.length ? <div className="cria-campaign-grid">{visible.map((item) => <article className="cria-library-card" key={item.id}><div className="cria-library-art is-blue"><Image src={item.image} alt={item.campaign.title} fill unoptimized style={{ objectFit: "cover" }} /><small>{item.format} · salva</small></div><div className="cria-library-card-info"><div><h3>{item.campaign.title}</h3><p>{new Date(item.createdAt).toLocaleString("pt-BR")}</p></div></div></article>)}</div> : <div className="cria-library-empty"><span>✦</span><h2>{items.length ? "Nenhuma criação encontrada" : "Sua biblioteca começa aqui"}</h2><p>{items.length ? "Tente outro termo ou filtro." : "Salve uma imagem no estúdio para vê-la nesta página."}</p><Link href="/studio">Criar primeira peça →</Link></div>}</section></main>;
}

export function BrandPage() {
  const stored = useBrand();
  const [draft, setDraft] = useState<BrandProfile>(emptyBrand);
  const [saved, setSaved] = useState(false);
  // Sync the editable draft when the persisted brand finishes hydrating.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setDraft(stored), [stored]);
  const update = <K extends keyof BrandProfile>(key: K, value: BrandProfile[K]) => { setSaved(false); setDraft((current) => ({ ...current, [key]: value })); };
  const toggleTone = (tone: string) => update("tone", draft.tone.includes(tone) ? draft.tone.filter((item) => item !== tone) : [...draft.tone, tone]);
  return <main className="cria-product-page"><ProductHeader active="Minha marca" /><section className="cria-page-inner cria-brand-page"><div className="cria-page-heading"><div><p className="cria-kicker"><i /> o que guia tudo</p><h1>Minha marca</h1><p>O brandbook usado pela crIA em cada geração.</p></div><button className="cria-primary-cta" type="button" onClick={() => { saveBrand(draft); setSaved(true); }}>{saved ? "Alterações salvas ✓" : "Salvar alterações"}</button></div><div className="cria-brand-layout"><aside className="cria-brand-summary"><div className="cria-brand-avatar">{initials(draft.companyName)}</div><h2>{draft.companyName}</h2><p>{draft.segment}</p><div className="cria-brand-score"><span>Marca configurada</span><strong>{draft.companyName === "Sua marca" ? "20%" : "100%"}</strong><i><b style={{ width: draft.companyName === "Sua marca" ? "20%" : "100%" }} /></i></div><Link href="/onboarding">Atualizar fontes →</Link></aside><div className="cria-brand-fields"><section><div className="cria-field-heading"><span>01</span><div><h3>Essência</h3><p>As palavras que definem o seu negócio.</p></div></div><div className="cria-brand-input-grid"><label>Nome da marca<input value={draft.companyName} onChange={(event) => update("companyName", event.target.value)} /></label><label>Segmento<input value={draft.segment} onChange={(event) => update("segment", event.target.value)} /></label><label className="is-wide">Posicionamento<textarea value={draft.positioning} onChange={(event) => update("positioning", event.target.value)} /></label><label className="is-wide">Público<textarea value={draft.audience} onChange={(event) => update("audience", event.target.value)} /></label></div></section><section><div className="cria-field-heading"><span>02</span><div><h3>Voz e personalidade</h3><p>Como a sua marca fala com as pessoas.</p></div></div><div className="cria-tone-list">{["Acolhedora", "Próxima", "Confiante", "Divertida", "Sofisticada"].map((tone) => <button type="button" className={draft.tone.includes(tone) ? "is-active" : ""} onClick={() => toggleTone(tone)} key={tone}>{tone}</button>)}</div><label className="cria-brand-label">Não fazemos <input value={draft.avoid.join(", ")} onChange={(event) => update("avoid", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} /></label></section><section><div className="cria-field-heading"><span>03</span><div><h3>Direção visual</h3><p>As cores que entram no briefing das imagens.</p></div></div><div className="cria-brand-input-grid"><label>Cor principal<input type="color" value={/^#[0-9a-f]{6}$/i.test(draft.primaryColor) ? draft.primaryColor : "#1952d1"} onChange={(event) => update("primaryColor", event.target.value)} /></label><label>Cores secundárias<input value={draft.secondaryColors.join(", ")} onChange={(event) => update("secondaryColors", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} /></label></div></section></div></div></section></main>;
}

export function PlanningPage() {
  const brand = useBrand();
  const items = useLibrary();
  const planned = useMemo(() => items.slice(0, 2), [items]);
  return <main className="cria-product-page"><ProductHeader active="Planejamento" /><section className="cria-page-inner"><div className="cria-page-heading"><div><p className="cria-kicker"><i /> conteúdo com intenção</p><h1>Planejamento</h1><p>Uma visão simples das criações recentes de {brand.companyName}.</p></div><Link className="cria-primary-cta" href="/studio">Criar campanha <span>→</span></Link></div><div className="cria-planning-board"><div className="cria-week-heading"><span /><div><b>agosto 2026</b><span>semana 34 · 17 — 23</span></div><span /></div><div className="cria-week-grid">{["seg 17", "ter 18", "qua 19", "qui 20", "sex 21", "sáb 22", "dom 23"].map((day, index) => <div className={`cria-day-column ${index === 2 ? "is-today" : ""}`} key={day}><span>{day}</span>{planned[index === 2 ? 0 : index === 4 ? 1 : -1] ? <article className={`cria-plan-card ${index === 2 ? "is-blue" : "is-yellow"}`}><small>{planned[index === 2 ? 0 : 1].format}</small><b>{planned[index === 2 ? 0 : 1].campaign.title}</b><p>{planned[index === 2 ? 0 : 1].campaign.caption.slice(0, 70)}…</p></article> : null}{index === 6 ? <Link className="cria-empty-plan" href="/studio">+ adicionar</Link> : null}</div>)}</div></div><div className="cria-planning-note"><span>✦</span><p><b>Uma sugestão da crIA</b><br />Crie uma peça sobre {brand.contentPillars[0] ?? "seu produto principal"} para manter o calendário ativo.</p><Link href="/studio">Criar a partir disso →</Link></div></section></main>;
}
