import Image from "next/image";
import Link from "next/link";

export function LandingPage() {
  return (
    <main className="cria-landing">
      <nav className="cria-landing-nav">
        <Link className="cria-landing-mark" href="/" aria-label="crIA início">
          <span className="cria-mark-dot" />
          <span>cr<span>IA</span></span>
        </Link>
        <div className="cria-landing-nav-links">
          <a href="#como-funciona">Como funciona</a>
          <a href="#para-quem">Para quem é</a>
        </div>
        <Link className="cria-nav-login" href="/onboarding">Entrar <span>↗</span></Link>
      </nav>

      <section className="cria-landing-hero">
        <div className="cria-landing-copy">
          <p className="cria-kicker"><i /> marketing com a sua cara</p>
          <h1>Ideias boas<br /><em>merecem aparecer.</em></h1>
          <p className="cria-landing-lede">A crIA entende o que torna o seu negócio especial e transforma isso em conteúdo que parece — e fala — como você.</p>
          <div className="cria-landing-actions">
            <Link className="cria-primary-cta" href="/onboarding">Criar minha marca <span>→</span></Link>
            <a className="cria-text-cta" href="#como-funciona">Ver como funciona <span>↓</span></a>
          </div>
          <div className="cria-trust-line"><span className="cria-avatar-stack"><i /><i /><i /></span><span>feito para quem faz<br /><b>o negócio acontecer</b></span></div>
        </div>
        <div className="cria-landing-visual" aria-label="Uma prévia de uma campanha criada pela crIA">
          <div className="cria-paper-shadow" />
          <div className="cria-campaign-card">
            <div className="cria-card-top"><span>crIA / campanha 001</span><b>aurora</b></div>
            <div className="cria-card-art"><span className="cria-card-orb cria-card-orb-a" /><span className="cria-card-orb cria-card-orb-b" /><Image src="/cria-mascot.png" alt="Mascote da crIA" width={205} height={205} /></div>
            <div className="cria-card-copy"><small>torra local · lote novo</small><strong>Sua manhã<br />pede algo<br /><em>especial.</em></strong><span>peça pelo WhatsApp →</span></div>
          </div>
          <div className="cria-floating-note cria-note-one"><span>01</span><p>entende<br /><b>sua marca</b></p></div>
          <div className="cria-floating-note cria-note-two"><span>02</span><p>cria conteúdo<br /><b>que combina</b></p></div>
        </div>
      </section>

      <section className="cria-landing-proof" id="como-funciona">
        <p className="cria-kicker"><i /> do briefing ao post</p>
        <h2>Você traz a história.<br /><em>A crIA dá forma.</em></h2>
        <div className="cria-proof-grid"><article><span>01</span><h3>Conhece o seu negócio</h3><p>Site, Instagram ou uma conversa. A crIA encontra o que faz sua marca ser sua.</p></article><article><span>02</span><h3>Cria com intenção</h3><p>Campanhas, posts e legendas pensados para o seu público — não para um template.</p></article><article><span>03</span><h3>Você decide o próximo passo</h3><p>Revise, ajuste e salve tudo em um só lugar. A marca continua sendo sua.</p></article></div>
      </section>
      <footer className="cria-landing-footer"><span>crIA — seu marketeiro favorito</span><Link href="/onboarding">começar agora →</Link></footer>
    </main>
  );
}
