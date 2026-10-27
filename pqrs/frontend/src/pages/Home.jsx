import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppIcon from "../components/AppIcon";
import "./Home.css";
import Login from "./Login";

function Brand({ compact = false }) {
  return <span className={`brand-lockup ${compact ? "brand-lockup-compact" : ""}`}>
    <img src="/hoodvoice-symbol.png" alt="" />
    <span><strong>HOOD<span>VOICE</span></strong><small>CARTAGENA</small></span>
  </span>;
}

function Home() {
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();

  return (
    <main className="home-page">
      <header className="home-topbar">
        <Brand />
        <div className="home-top-actions"><button type="button" className="home-login-link" onClick={() => setShowLogin(true)}>Iniciar sesión</button><button type="button" className="home-register-button" onClick={() => navigate("/register")}>Crear cuenta <AppIcon name="arrowRight" size={17}/></button></div>
      </header>
      <section className="home-hero">
        <div className="home-hero-overlay" />
        <div className="home-hero-copy">
          <span className="home-eyebrow"><span/> UNA VOZ PARA TU COMUNIDAD</span>
          <h1>Tu voz construye<br/><em>una mejor Cartagena.</em></h1>
          <p>Registra peticiones, quejas, reclamos y sugerencias de forma sencilla. HoodVoice te ayuda a centralizar tus solicitudes y seguir su avance.</p>
          <div className="home-hero-actions"><button type="button" className="home-register-button home-register-button-large" onClick={() => navigate("/register")}>Comenzar ahora <AppIcon name="arrowRight" size={19}/></button><button type="button" className="home-watch-button" onClick={() => setShowLogin(true)}><AppIcon name="user" size={18}/> Ya tengo una cuenta</button></div>
          <div className="home-trust-row"><span><AppIcon name="shield" size={16}/> Acceso por cuenta</span><span><AppIcon name="files" size={16}/> Seguimiento de solicitudes</span></div>
        </div>
        <div className="home-hero-art" aria-hidden="true"><div className="home-art-ring ring-one"/><div className="home-art-ring ring-two"/><div className="home-art-logo"><img src="/hoodvoice-symbol.png" alt=""/><strong>HOODVOICE</strong><small>CARTAGENA</small></div><span className="home-art-pill pill-one"><AppIcon name="fileText" size={18}/> Peticiones</span><span className="home-art-pill pill-two"><AppIcon name="checkCircle" size={18}/> Seguimiento</span></div>
        <div className="home-hero-city" aria-hidden="true">CARTAGENA · BOLÍVAR</div>
      </section>
      <section className="home-benefits">
        <div className="home-benefit"><span><AppIcon name="filePlus" size={23}/></span><div><strong>Registra fácilmente</strong><p>Describe tu solicitud y adjunta documentos de soporte.</p></div></div>
        <div className="home-benefit"><span><AppIcon name="eye" size={23}/></span><div><strong>Consulta el avance</strong><p>Revisa tus solicitudes y los cambios de estado.</p></div></div>
        <div className="home-benefit"><span><AppIcon name="chart" size={23}/></span><div><strong>Todo centralizado</strong><p>Un espacio claro para ver tus trámites y su información.</p></div></div>
      </section>
      <footer className="home-footer"><Brand compact/><span>Una plataforma para escuchar y gestionar la voz ciudadana.</span><small>© HoodVoice Cartagena</small></footer>
      {showLogin && <Login close={() => setShowLogin(false)} />}
    </main>
  );
}

export default Home;
