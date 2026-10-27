import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppIcon from "../components/AppIcon";
import { useFeedback } from "../components/FeedbackProvider";
import "./Register.css";

function Register() {
  const navigate = useNavigate();
  const { notify } = useFeedback();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);

  const registrar = async (event) => {
    event.preventDefault();
    if (!nombre.trim() || !username.trim() || !email.trim() || !password) {
      await notify("Completa todos los campos para crear tu cuenta.", { title: "Datos requeridos", tone: "warning" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      await notify("Escribe una dirección de correo electrónico válida.", { title: "Correo no válido", tone: "warning" });
      return;
    }
    setEnviando(true);
    try {
      const body = { nombre: nombre.trim(), username: username.trim(), email: email.trim(), password, role: "USER" };
      const response = await fetch("http://localhost:8080/test/register", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (response.ok) {
        await notify("Tu cuenta se creó correctamente. Ya puedes iniciar sesión en HoodVoice Cartagena.", { title: "¡Bienvenido a HoodVoice!", tone: "success" });
        navigate("/");
      } else {
        const detail = await response.text();
        console.error("Error al registrar usuario:", response.status, detail);
        await notify(detail || `No fue posible crear la cuenta (HTTP ${response.status}).`, { title: "No se pudo completar el registro", tone: "error" });
      }
    } catch (error) {
      console.error("Error de conexión al registrar usuario:", error);
      await notify("No fue posible conectar con el servidor. Intenta de nuevo cuando el servicio esté disponible.", { title: "Error de conexión", tone: "error" });
    } finally { setEnviando(false); }
  };

  return (
    <main className="register-page">
      <header className="register-topbar"><button type="button" className="register-brand" onClick={() => navigate("/")}><img src="/hoodvoice-symbol.png" alt=""/><span><strong>HOOD<span>VOICE</span></strong><small>CARTAGENA</small></span></button><button type="button" className="register-back-link" onClick={() => navigate("/")}><AppIcon name="arrowLeft" size={17}/> Volver al inicio</button></header>
      <section className="register-layout">
        <aside className="register-intro-panel"><span className="register-intro-kicker">COMUNIDAD HOODVOICE</span><h1>Tu voz tiene<br/><em>un lugar aquí.</em></h1><p>Crea tu cuenta para registrar solicitudes, adjuntar documentos y consultar el avance de tus PQRS.</p><div className="register-intro-items"><span><AppIcon name="filePlus" size={18}/> Registra solicitudes</span><span><AppIcon name="eye" size={18}/> Consulta su seguimiento</span><span><AppIcon name="shield" size={18}/> Acceso personal</span></div><div className="register-intro-seal"><img src="/hoodvoice-symbol.png" alt=""/><div><strong>HOODVOICE</strong><small>CARTAGENA</small></div></div></aside>
        <section className="register-box" aria-labelledby="register-title">
          <span className="register-eyebrow">EMPIEZA EN UNOS PASOS</span><h2 id="register-title">Crear cuenta</h2><p className="subtitle">Regístrate para utilizar los servicios de HoodVoice Cartagena.</p>
          <form className="register-form" onSubmit={registrar}>
            <label className="register-field"><span>Nombre completo</span><input type="text" name="nombre" placeholder="Escribe tu nombre" autoComplete="name" value={nombre} onChange={(event) => setNombre(event.target.value)} required/></label>
            <label className="register-field"><span>Nombre de usuario</span><input type="text" name="username" placeholder="Elige un usuario" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required/></label>
            <label className="register-field"><span>Correo electrónico</span><input type="email" name="email" placeholder="nombre@gmail.com" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required/></label>
            <label className="register-field"><span>Contraseña</span><input type="password" name="password" placeholder="Crea una contraseña" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={4} required/><small>Utiliza al menos 4 caracteres.</small></label>
            <button className="register-submit" type="submit" disabled={enviando}>{enviando ? "Creando cuenta..." : "Registrarme"}<AppIcon name="arrowRight" size={18}/></button>
          </form>
          <p className="login-link">¿Ya tienes cuenta? <button type="button" onClick={() => navigate("/")}>Iniciar sesión</button></p>
          <p className="register-note"><AppIcon name="shield" size={15}/> Tus datos se utilizarán para gestionar tus solicitudes.</p>
        </section>
      </section>
      <footer className="register-footer"><span>HOODVOICE <b>CARTAGENA</b></span><small>Una plataforma para escuchar y gestionar la voz ciudadana.</small></footer>
    </main>
  );
}

export default Register;
