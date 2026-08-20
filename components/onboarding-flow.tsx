"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandProfile, emptyBrand, saveBrand } from "@/lib/cria-store";

export function OnboardingFlow() {
  const [choice, setChoice] = useState<"business" | "identity" | null>(null);
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [identityName, setIdentityName] = useState("");
  const [identitySegment, setIdentitySegment] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "review" | "error">("idle");
  const [error, setError] = useState("");
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const router = useRouter();

  async function analyzeWebsite() {
    if (!website.trim() || status === "loading") return;
    setStatus("loading");
    setError("");
    try {
      const response = await fetch("/api/brand/ingest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ websiteUrl: website.trim(), instagramUsername: instagram.trim().replace(/^@/, "") || undefined }) });
      const result = await response.json() as { analysis?: Partial<BrandProfile>; error?: string };
      if (!response.ok || !result.analysis) throw new Error(result.error ?? "Não foi possível analisar sua marca.");
      const profile: BrandProfile = { ...emptyBrand, ...result.analysis, websiteUrl: website.trim(), instagramHandle: instagram.trim().replace(/^@/, "") || undefined };
      setBrand(profile);
      setStatus("review");
    } catch (caught) {
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "Não foi possível analisar sua marca.");
    }
  }

  function confirmAnalyzedBrand() {
    if (!brand) return;
    saveBrand(brand);
    router.push("/studio");
  }

  function confirmIdentity() {
    if (!identityName.trim() || !identitySegment.trim()) return;
    saveBrand({ ...emptyBrand, companyName: identityName.trim(), segment: identitySegment.trim(), positioning: `${identityName.trim()} é uma marca de ${identitySegment.trim()} construída com clareza e proximidade.` });
    router.push("/brand");
  }

  return <main className="cria-onboarding">
    <header className="cria-onboarding-header"><Link href="/" className="cria-landing-mark"><Image src="/cria-icon-v2.png" alt="" width={30} height={30} /><span>cr<span>IA</span></span></Link><span className="cria-step-label">comece por aqui <b>{status === "review" ? "2 / 2" : "1 / 2"}</b></span></header>
    <section className="cria-onboarding-layout">
      <div className="cria-onboarding-intro"><p className="cria-kicker"><i /> vamos construir sua presença</p><h1>Antes de criar,<br /><em>vamos conhecer<br />sua marca.</em></h1><p>Isso leva menos de dois minutos. A partir daqui, tudo o que a crIA fizer vai ter a sua voz.</p><div className="cria-onboarding-aside"><span>✦</span><p>Você pode mudar<br />tudo depois.</p></div></div>
      <div className="cria-onboarding-form">
        <p className="cria-form-step">{status === "review" ? "revise antes de continuar" : "primeiro, uma escolha"}</p><h2>{status === "review" ? "Reconhece sua marca?" : "Como começamos?"}</h2><p className="cria-form-help">{status === "review" ? "Ajuste os campos que a IA encontrou antes de ativar o brandbook." : "Escolha o caminho que faz mais sentido para você agora."}</p>
        {status !== "review" ? <div className="cria-choice-grid"><button type="button" className={choice === "business" ? "is-selected" : ""} onClick={() => setChoice("business")}><span className="cria-choice-icon">↗</span><span><strong>Já tenho um negócio</strong><small>Quero trazer minha marca para dentro</small></span><b>→</b></button><button type="button" className={choice === "identity" ? "is-selected" : ""} onClick={() => setChoice("identity")}><span className="cria-choice-icon cria-choice-spark">✦</span><span><strong>Quero criar minha identidade</strong><small>A crIA me ajuda a descobrir meu jeito</small></span><b>→</b></button></div> : null}
        {choice === "business" ? <div className="cria-onboarding-fields">
          {status !== "review" ? <><label>Site da empresa <span>obrigatório</span><input type="url" value={website} onChange={(event) => setWebsite(event.target.value)} placeholder="https://seunegocio.com.br" /></label><label>Instagram <span>opcional</span><input value={instagram} onChange={(event) => setInstagram(event.target.value)} placeholder="@seunegocio" /></label><p className="cria-field-note">A crIA usa essas fontes para entender sua marca. Você revisa tudo antes de salvar.</p></> : brand ? <div className="cria-brand-review"><label>Nome<input value={brand.companyName} onChange={(event) => setBrand({ ...brand, companyName: event.target.value })} /></label><label>Segmento<input value={brand.segment} onChange={(event) => setBrand({ ...brand, segment: event.target.value })} /></label><label>Posicionamento<textarea value={brand.positioning} onChange={(event) => setBrand({ ...brand, positioning: event.target.value })} /></label><label>Tom<input value={brand.tone.join(", ")} onChange={(event) => setBrand({ ...brand, tone: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /></label><small>{brand.products.length} produto(s) e {brand.logoUrls.length} referência(s) visual(is) encontradas.</small></div> : null}
          {error ? <p className="cria-ingest-error" role="alert">{error}</p> : null}<button className="cria-primary-cta cria-full-cta" type="button" onClick={status === "review" ? confirmAnalyzedBrand : analyzeWebsite} disabled={!website.trim() || status === "loading"}>{status === "loading" ? <>Analisando site e marca <span>…</span></> : status === "review" ? <>Ativar brandbook <span>→</span></> : <>Analisar minha marca <span>→</span></>}</button>
        </div> : null}
        {choice === "identity" ? <div className="cria-onboarding-fields cria-identity-preview"><div><span className="cria-chat-avatar">✦</span><p>Conte o básico e ajuste o restante no brandbook.</p></div><label>Nome da marca <span>obrigatório</span><input value={identityName} onChange={(event) => setIdentityName(event.target.value)} placeholder="Nome do seu negócio" /></label><label>O que ela faz? <span>obrigatório</span><input value={identitySegment} onChange={(event) => setIdentitySegment(event.target.value)} placeholder="Ex.: confeitaria artesanal" /></label><button type="button" className="cria-primary-cta cria-full-cta" onClick={confirmIdentity} disabled={!identityName.trim() || !identitySegment.trim()}>Criar meu brandbook <span>→</span></button></div> : null}
        {!choice ? <p className="cria-form-footnote">Sem cartão. Sem compromisso. Só um bom começo.</p> : null}
      </div>
    </section>
  </main>;
}
