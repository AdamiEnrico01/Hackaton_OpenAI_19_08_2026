"use client";

import Link from "next/link";
import { useState } from "react";

export function OnboardingFlow() {
  const [choice, setChoice] = useState<"business" | "identity" | null>(null);
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");

  return (
    <main className="cria-onboarding">
      <header className="cria-onboarding-header"><Link href="/" className="cria-landing-mark"><span className="cria-mark-dot" /><span>cr<span>IA</span></span></Link><span className="cria-step-label">comece por aqui <b>1 / 2</b></span></header>
      <section className="cria-onboarding-layout">
        <div className="cria-onboarding-intro"><p className="cria-kicker"><i /> vamos construir sua presença</p><h1>Antes de criar,<br /><em>vamos conhecer<br />sua marca.</em></h1><p>Isso leva menos de dois minutos. A partir daqui, tudo o que a crIA fizer vai ter a sua voz.</p><div className="cria-onboarding-aside"><span>✦</span><p>Você pode mudar<br />tudo depois.</p></div></div>
        <div className="cria-onboarding-form">
          <p className="cria-form-step">primeiro, uma escolha</p><h2>Como começamos?</h2><p className="cria-form-help">Escolha o caminho que faz mais sentido para você agora.</p>
          <div className="cria-choice-grid">
            <button type="button" className={choice === "business" ? "is-selected" : ""} onClick={() => setChoice("business")}><span className="cria-choice-icon">↗</span><span><strong>Já tenho um negócio</strong><small>Quero trazer minha marca para dentro</small></span><b>→</b></button>
            <button type="button" className={choice === "identity" ? "is-selected" : ""} onClick={() => setChoice("identity")}><span className="cria-choice-icon cria-choice-spark">✦</span><span><strong>Quero criar minha identidade</strong><small>A crIA me ajuda a descobrir meu jeito</small></span><b>→</b></button>
          </div>
          {choice === "business" ? <div className="cria-onboarding-fields"><label>Site da empresa <span>opcional</span><input value={website} onChange={(event) => setWebsite(event.target.value)} placeholder="https://seunegocio.com.br" /></label><label>Instagram <span>opcional</span><input value={instagram} onChange={(event) => setInstagram(event.target.value)} placeholder="@seunegocio" /></label><p className="cria-field-note">A crIA usa essas fontes para entender sua marca. Você revisa tudo antes de salvar.</p><Link className="cria-primary-cta cria-full-cta" href="/studio">Continuar <span>→</span></Link></div> : null}
          {choice === "identity" ? <div className="cria-identity-preview"><div><span className="cria-chat-avatar">✦</span><p>Perfeito. Vamos descobrir a marca que já existe dentro da sua ideia.</p></div><Link className="cria-primary-cta cria-full-cta" href="/studio">Conversar com a crIA <span>→</span></Link></div> : null}
          {!choice ? <p className="cria-form-footnote">Sem cartão. Sem compromisso. Só um bom começo.</p> : null}
        </div>
      </section>
    </main>
  );
}
