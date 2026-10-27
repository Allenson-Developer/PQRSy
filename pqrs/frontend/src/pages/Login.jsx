import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppIcon from "../components/AppIcon";
import { useFeedback } from "../components/FeedbackProvider";
import "./Login.css";

function Login({ close }) {
  const navigate = useNavigate();
  const { notify } = useFeedback();
  const [modo, setModo] = useState("USER");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [documento, setDocumento] = useState("");
  const [enviando, setEnviando] = useState(false);

  const cerrar = () => {
    if (typeof close === "function") close();
    else navigate("/");
  };

  const iniciarSesion = async (event) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      await notify("Completa el nombre de usuario y la contraseña para continuar.", { title: "Datos requeridos", tone: "warning" });
      return;
    }
    if (modo === "ADMIN" && !documento.trim()) {
      await notify("Ingresa el ID de administrador para validar tu acceso.", { title: "Identificación requerida", tone: "warning" });
      return;
    }

    setEnviando(true);
    try {
      const response = await fetch("http://localhost:8080/test/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password, documento: modo === "ADMIN" ? documento.trim() : null }),
      });
      if (!response.ok) {
        const error = await response.text();
        await notify(error || "No fue posible iniciar sesión. Verifica tus datos e inténtalo nuevamente.", { title: "No se pudo iniciar sesión", tone: "error" });
        return;
      }
      const data = await response.json();
      if (!data || !data.id) {
        await notify("El servidor respondió sin el identificador de usuario esperado.", { title: "Respuesta inesperada", tone: "error" });
        return;
      }
      const userData = { ...data, role: data.role || "USER" };
      localStorage.setItem("user", JSON.stringify(userData));
      if (data.token) localStorage.setItem("token", data.token);
      await notify(`Hola, ${userData.nombre || userData.username || "bienvenido"}. Tu sesión está activa.`, { title: "Inicio de sesión exitoso", tone: "success" });
      if (String(userData.role).toUpperCase() === "ADMIN") navigate("/admin");
      else navigate("/user");
      if (typeof close === "function") close();
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      await notify("No fue posible conectar con el servidor. Comprueba que el backend esté activo.", { title: "Error de conexión", tone: "error" });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="login-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) cerrar(); }}>
      <section className="login-box" role="dialog" aria-modal="true" aria-labelledby="login-title">
        <button type="button" className="login-close" onClick={cerrar} aria-label="Cerrar inicio de sesión"><AppIcon name="close" size={19}/></button>
        <div className="login-visual-panel"><div className="login-visual-glow"/><img src="/hoodvoice-symbol.png" alt=""/><span>HOODVOICE</span><small>CARTAGENA</small><p>Tu voz cuenta.<br/>Estamos aquí para escucharte.</p><div className="login-visual-foot"><AppIcon name="shield" size={16}/> Acceso seguro por cuenta</div></div>
        <div className="login-form-panel">
          <div className="login-heading"><span className="login-eyebrow">BIENVENIDO DE NUEVO</span><h2 id="login-title">Iniciar sesión</h2><p>Ingresa tus datos para continuar en HoodVoice Cartagena.</p></div>
          <div className="login-mode-switch" aria-label="Tipo de cuenta">
            <button type="button" className={modo === "USER" ? "active" : ""} aria-pressed={modo === "USER"} onClick={() => setModo("USER")}><AppIcon name="user" size={17}/> Usuario</button>
            <button type="button" className={modo === "ADMIN" ? "active" : ""} aria-pressed={modo === "ADMIN"} onClick={() => setModo("ADMIN")}><AppIcon name="shield" size={17}/> Administrador</button>
          </div>
          <form className="login-form" onSubmit={iniciarSesion}>
            <label className="login-field"><span>Nombre de usuario</span><input type="text" placeholder="Escribe tu usuario" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required/></label>
            <label className="login-field"><span>Contraseña</span><input type="password" placeholder="Escribe tu contraseña" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required/></label>
            {modo === "ADMIN" && <label className="login-field"><span>ID de administrador</span><input type="text" placeholder="Ingresa tu ID de administrador" autoComplete="off" value={documento} onChange={(event) => setDocumento(event.target.value)} required/></label>}
            <button type="submit" className="login-submit" disabled={enviando}>{enviando ? "Validando acceso..." : "Ingresar a mi cuenta"}<AppIcon name="arrowRight" size={18}/></button>
          </form>
          <p className="login-register-link">¿Todavía no tienes cuenta? <button type="button" onClick={() => { if (typeof close === "function") close(); navigate("/register"); }}>Crear cuenta</button></p>
          <p className="login-privacy-note"><AppIcon name="shield" size={15}/> Tu información de acceso se utiliza para validar tu cuenta.</p>
        </div>
      </section>
    </div>
  );
}

export default Login;
