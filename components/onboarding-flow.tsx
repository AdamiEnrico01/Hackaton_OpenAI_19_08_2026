"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function OnboardingFlow() {
  const [choice, setChoice] = useState<"business" | "identity" | null>(null);
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [ingestStatus, setIngestStatus] = useState<"idle" | "loading" | "error">("idle");
  const [ingestError, setIngestError] = useState("");
  const router = useRouter();

  async function ingestBrand() {
    if (!website.trim() || ingestStatus === "loading") return;
    setIngestStatus("loading");
    setIngestError("");
    try {
      const response = await fetch("/api/brand/ingest", { method: "POST", headers: { "Content-Type": "application/json", ...(process.env.NEXT_PUBLIC_CRIA_TEST_TOKEN ? { Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRIA_TEST_TOKEN}` } : {}) }, body: JSON.stringify({ websiteUrl: website.trim(), instagramUsername: instagram.trim().replace(/^@/, "") || undefined }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Não foi possível analisar sua marca.");
      window.localStorage.setItem("cria-brand-analysis", JSON.stringify(result));
      router.push("/studio");
    } catch (error) {
      setIngestStatus("error");
      setIngestError(error instanceof Error ? error.message : "Não foi possível analisar sua marca.");
    }
  }

  return (
    <main className="cria-onboarding">
      <header className="cria-onboarding-header"><Link href="/" className="cria-landing-mark"><Image src="/cria-icon-v2.png" alt="" width={30} height={30} /><span>cr<span>IA</span></span></Link><span className="cria-step-label">comece por aqui <b>1 / 2</b></span></header>
      <section className="cria-onboarding-layout">
        <div className="cria-onboarding-intro"><p className="cria-kicker"><i /> vamos construir sua presença</p><h1>Antes de criar,<br /><em>vamos conhecer<br />sua marca.</em></h1><p>Isso leva menos de dois minutos. A partir daqui, tudo o que a crIA fizer vai ter a sua voz.</p><div className="cria-onboarding-aside"><span>✦</span><p>Você pode mudar<br />tudo depois.</p></div></div>
        <div className="cria-onboarding-form">
          <p className="cria-form-step">primeiro, uma escolha</p><h2>Como começamos?</h2><p className="cria-form-help">Escolha o caminho que faz mais sentido para você agora.</p>
          <div className="cria-choice-grid">
            <button type="button" className={choice === "business" ? "is-selected" : ""} onClick={() => setChoice("business")}><span className="cria-choice-icon">↗</span><span><strong>Já tenho um negócio</strong><small>Quero trazer minha marca para dentro</small></span><b>→</b></button>
            <button type="button" className={choice === "identity" ? "is-selected" : ""} onClick={() => setChoice("identity")}><span className="cria-choice-icon cria-choice-spark">✦</span><span><strong>Quero criar minha identidade</strong><small>A crIA me ajuda a descobrir meu jeito</small></span><b>→</b></button>
          </div>
          {choice === "business" ? <div className="cria-onboarding-fields"><label>Site da empresa <span>obrigatório</span><input value={website} onChange={(event) => setWebsite(event.target.value)} placeholder="https://seunegocio.com.br" /></label><label>Instagram <span>opcional</span><input value={instagram} onChange={(event) => setInstagram(event.target.value)} placeholder="@seunegocio" /></label><p className="cria-field-note">A crIA usa essas fontes para entender sua marca. Você revisa tudo antes de salvar.</p>{ingestError ? <p className="cria-ingest-error" role="alert">{ingestError}</p> : null}<button className="cria-primary-cta cria-full-cta" type="button" onClick={ingestBrand} disabled={!website.trim() || ingestStatus === "loading"}>{ingestStatus === "loading" ? <>Analisando sua marca <span>…</span></> : <>Continuar <span>→</span></>}</button></div> : null}
          {choice === "identity" ? <div className="cria-identity-preview"><div><span className="cria-chat-avatar">✦</span><p>Perfeito. Vamos descobrir a marca que já existe dentro da sua ideia.</p></div><Link className="cria-primary-cta cria-full-cta" href="/studio">Conversar com a crIA <span>→</span></Link></div> : null}
          {!choice ? <p className="cria-form-footnote">Sem cartão. Sem compromisso. Só um bom começo.</p> : null}
        </div>
      </section>
    </main>
  );
}
