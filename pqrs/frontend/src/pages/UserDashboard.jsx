import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import AppIcon from "../components/AppIcon";
import { useFeedback } from "../components/FeedbackProvider";
import DetallePQRS from "./DetallePQRS";
import "../styles/portal.css";
import "./UserDashboard.css";

const API_URL = "http://localhost:8080";

const TIPOS_PQRS = [
  { value: "PETICION", title: "Petición", icon: "fileText", description: "Solicita información, documentos o actuaciones de interés general o particular." },
  { value: "QUEJA", title: "Queja", icon: "hand", description: "Manifiesta inconformidad frente a la atención recibida o una actuación." },
  { value: "RECLAMO", title: "Reclamo", icon: "megaphone", description: "Solicita una solución cuando un servicio no se prestó correctamente." },
  { value: "SUGERENCIA", title: "Sugerencia", icon: "lightbulb", description: "Comparte una idea para mejorar los servicios de tu comunidad." },
  { value: "FELICITACION", title: "Felicitación", icon: "star", description: "Reconoce una buena atención o una acción destacada." },
  { value: "DENUNCIA", title: "Denuncia", icon: "shield", description: "Informa sobre hechos que requieren revisión por parte de la entidad." },
];

function leerUsuarioGuardado() {
  try {
    const value = localStorage.getItem("user");
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error("No se pudo leer el usuario guardado:", error);
    return null;
  }
}

function obtenerToken() {
  return localStorage.getItem("token");
}

function encabezadosAutenticados(encabezados = {}) {
  const token = obtenerToken();
  return { ...encabezados, ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function detalleErrorRespuesta(response) {
  try {
    return (await response.text()) || `HTTP ${response.status} ${response.statusText}`;
  } catch {
    return `HTTP ${response.status} ${response.statusText}`;
  }
}

function formatearFecha(fecha) {
  if (!fecha) return "Fecha no disponible";
  const parsed = new Date(fecha);
  if (Number.isNaN(parsed.getTime())) return "Fecha no disponible";
  return parsed.toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
}

function obtenerId(item) {
  return item?.id || item?._id || "";
}

function tipoSlug(tipo) {
  const valor = String(tipo || "").toLowerCase();
  if (valor.includes("pet")) return "peticion";
  if (valor.includes("queja")) return "queja";
  if (valor.includes("recl")) return "reclamo";
  if (valor.includes("sug")) return "sugerencia";
  if (valor.includes("fel")) return "felicitacion";
  if (valor.includes("den")) return "denuncia";
  return "general";
}

function obtenerCodigoVisible(item) {
  const code = item?.codigoPQRS || item?.codigoPqrs || item?.codigo || item?.numeroRadicado;
  if (code) return { label: "Código PQRS", value: String(code) };
  const id = obtenerId(item);
  return { label: "Referencia", value: id ? String(id) : "Pendiente de asignación" };
}

function UserDashboard() {
  const [vista, setVista] = useState("inicio");
  const [pqrsSeleccionada, setPqrsSeleccionada] = useState(null);
  const [usuario, setUsuario] = useState(leerUsuarioGuardado);
  const { confirmAction } = useFeedback();

  useEffect(() => {
    if (!usuario) window.location.href = "/";
  }, [usuario]);

  const logout = async () => {
    const confirmado = await confirmAction("Se cerrará tu sesión actual y volverás a la pantalla de bienvenida.", {
      title: "¿Deseas cerrar sesión?",
      confirmLabel: "Cerrar sesión",
      cancelLabel: "Continuar aquí",
      tone: "warning",
    });
    if (!confirmado) return;
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const actualizarUsuarioLocal = (nextUser) => {
    setUsuario(nextUser);
    localStorage.setItem("user", JSON.stringify(nextUser));
  };

  return (
    <div className="portal-shell user-portal">
      <Navbar role="USER" user={usuario} activeView={vista} onNavigate={setVista} onLogout={logout} onUserUpdated={actualizarUsuarioLocal} />
      <main className="portal-main user-main">
        {vista === "inicio" && <InicioUsuario usuario={usuario} onNavigate={setVista} />}
        {vista === "crear" && <CrearPQRS usuario={usuario} onCreated={() => setVista("ver")} />}
        {vista === "ver" && <VerPQRS usuario={usuario} onNavigate={setVista} onOpenTracking={(item) => { setPqrsSeleccionada(item); setVista("detalle"); }} />}
        {vista === "detalle" && <DetallePQRS pqrs={pqrsSeleccionada} volver={() => setVista("ver")} />}
        {vista === "stats" && <Stats usuario={usuario} />}
        {vista === "perfil" && <Perfil usuario={usuario} onUserUpdated={actualizarUsuarioLocal} />}
      </main>
      <footer className="portal-footer"><span>HOODVOICE <b>CARTAGENA</b></span><span>Gestión ciudadana, más clara y cercana.</span></footer>
    </div>
  );
}

export default UserDashboard;

function InicioUsuario({ usuario, onNavigate }) {
  const cards = [
    { view: "crear", title: "Crear una PQRS", desc: "Cuéntanos qué necesitas gestionar.", icon: "filePlus", art: "peticion", cta: "Registrar solicitud" },
    { view: "ver", title: "Mis solicitudes", desc: "Consulta tus casos y sus novedades.", icon: "files", art: "solicitudes", cta: "Ver solicitudes" },
    { view: "stats", title: "Mis estadísticas", desc: "Revisa el resumen de tus solicitudes.", icon: "chart", art: "estadisticas", cta: "Ver resumen" },
  ];

  return (
    <div className="user-home-page">
      <section className="portal-welcome-banner">
        <div className="portal-welcome-copy">
          <span className="portal-eyebrow">HOODVOICE CARTAGENA</span>
          <h1>Hola, {usuario?.nombre?.split(" ")[0] || usuario?.username || "bienvenido"}</h1>
          <p>Tu voz cuenta. Registra solicitudes y consulta su avance desde un solo lugar.</p>
          <button type="button" className="portal-button portal-button-primary" onClick={() => onNavigate("crear")}>
            <AppIcon name="plus" size={19}/> Crear nueva PQRS
          </button>
        </div>
        <div className="portal-welcome-mark" aria-hidden="true">
          <span className="welcome-orbit welcome-orbit-one"/><span className="welcome-orbit welcome-orbit-two"/>
          <img src="/hoodvoice-symbol.png" alt=""/>
        </div>
      </section>
      <div className="portal-section-heading">
        <div><span className="portal-eyebrow">TU ESPACIO</span><h2>¿Qué deseas hacer hoy?</h2><p>Accede rápidamente a las funciones de tu cuenta.</p></div>
      </div>
      <div className="portal-feature-row">
        {cards.map((card) => (
          <button type="button" key={card.view} className={`portal-feature-card feature-${card.art}`} onClick={() => onNavigate(card.view)}>
            <span className={`portal-feature-art art-${card.art}`}><AppIcon name={card.icon} size={38}/><span className="portal-feature-arrow"><AppIcon name="arrowLeft" size={17}/></span></span>
            <span className="portal-feature-copy"><strong>{card.title}</strong><small>{card.desc}</small><span className="portal-feature-cta">{card.cta} <AppIcon name="chevronRight" size={15}/></span></span>
          </button>
        ))}
      </div>
      <section className="portal-home-note"><span className="portal-home-note-icon"><AppIcon name="shield" size={22}/></span><div><strong>Tu solicitud, con seguimiento</strong><p>Conserva el código de referencia de tu PQRS para identificarla fácilmente cuando consultes tus solicitudes.</p></div></section>
    </div>
  );
}

function CrearPQRS({ usuario, onCreated }) {
  const { notify } = useFeedback();
  const [tipo, setTipo] = useState("");
  const [nombre, setNombre] = useState(usuario?.nombre || "");
  const [documento, setDocumento] = useState(usuario?.documento || usuario?.identificacion || "");
  const [email, setEmail] = useState(usuario?.email || usuario?.correo || "");
  const [descripcion, setDescripcion] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState("");

  useEffect(() => {
    setNombre(usuario?.nombre || "");
    setDocumento(usuario?.documento || usuario?.identificacion || "");
    setEmail(usuario?.email || usuario?.correo || "");
  }, [usuario?.nombre, usuario?.documento, usuario?.identificacion, usuario?.email, usuario?.correo]);

  const tipoSeleccionado = TIPOS_PQRS.find((item) => item.value === tipo);

  const enviarPQRS = async (event) => {
    event.preventDefault();
    setErrorFormulario("");
    if (!tipo) return setErrorFormulario("Selecciona el tipo de solicitud que deseas registrar.");
    if (!nombre.trim() || !documento.trim() || !email.trim() || !descripcion.trim()) {
      return setErrorFormulario("Completa nombre, identificación, correo electrónico y descripción.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return setErrorFormulario("Escribe un correo electrónico válido.");
    }
    const token = obtenerToken();
    const usuarioId = usuario?.id || usuario?._id;
    if (!token || !usuarioId) {
      await notify("No se encontró la sesión del usuario. Vuelve a iniciar sesión.", { title: "Sesión no disponible", tone: "error" });
      window.location.href = "/";
      return;
    }

    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append("tipo", tipo);
      formData.append("descripcion", descripcion.trim());
      formData.append("usuarioId", usuarioId);
      // Estos datos están incluidos en el formulario visual; el backend deberá persistirlos
      // para que aparezcan como campos propios en la PQRS.
      formData.append("nombre", nombre.trim());
      formData.append("documento", documento.trim());
      formData.append("identificacion", documento.trim());
      formData.append("email", email.trim());
      if (archivo) formData.append("archivo", archivo);

      const response = await fetch(`${API_URL}/pqrs`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) {
        const detalle = await detalleErrorRespuesta(response);
        console.error("Error al enviar PQRS:", response.status, detalle);
        setErrorFormulario(`No se pudo registrar la solicitud (HTTP ${response.status}). Revisa los datos e inténtalo de nuevo.`);
        return;
      }

      let resultado = null;
      try {
        const tipoContenido = response.headers.get("content-type") || "";
        if (tipoContenido.includes("application/json")) resultado = await response.json();
        else {
          const texto = await response.text();
          resultado = texto ? { mensaje: texto } : null;
        }
      } catch { /* El endpoint puede responder sin cuerpo. */ }
      const codigo = resultado?.codigoPQRS || resultado?.codigoPqrs || resultado?.codigo || resultado?.numeroRadicado || resultado?.id || resultado?._id;
      const mensaje = codigo
        ? `Tu solicitud fue registrada correctamente. Guarda este código de referencia: ${codigo}. Podrás consultar su estado en “Mis solicitudes”.`
        : "Tu solicitud fue registrada correctamente. Podrás consultar su referencia y estado en “Mis solicitudes”.";
      setTipo(""); setNombre(usuario?.nombre || nombre); setDocumento(usuario?.documento || documento); setEmail(usuario?.email || email); setDescripcion(""); setArchivo(null);
      await notify(mensaje, { title: "¡PQRS registrada!", tone: "success", confirmLabel: "Continuar" });
      onCreated?.();
    } catch (error) {
      console.error("Error de conexión al enviar PQRS:", error);
      setErrorFormulario("No fue posible conectar con el servidor. Comprueba que el backend esté activo.");
    } finally {
      setEnviando(false);
    }
  };

  if (!tipoSeleccionado) {
    return (
      <section className="create-page">
        <div className="portal-page-heading"><div><span className="portal-eyebrow">NUEVA SOLICITUD</span><h1 className="portal-page-title-accent">¿Qué tipo de solicitud deseas registrar?</h1><p>Selecciona una categoría para continuar. Te guiaremos en el registro de tu PQRS.</p></div></div>
        <div className="request-type-list">
          {TIPOS_PQRS.map((item) => (
            <article className={`request-type-row request-type-${tipoSlug(item.value)}`} key={item.value}>
              <div className="request-type-visual"><span><AppIcon name={item.icon} size={34}/></span></div>
              <div className="request-type-copy"><h2>{item.title}</h2><p>{item.description}</p></div>
              <button type="button" className="portal-button portal-button-primary request-type-button" onClick={() => setTipo(item.value)}>Enviar una {item.title.toLowerCase()} <AppIcon name="chevronRight" size={17}/></button>
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="create-page">
      <button type="button" className="portal-back-button" onClick={() => { setTipo(""); setErrorFormulario(""); }}><AppIcon name="arrowLeft" size={18}/> Volver a los tipos de solicitud</button>
      <div className="portal-page-heading"><div><span className="portal-eyebrow">FORMULARIO DE REGISTRO</span><h1 className="portal-page-title-accent">Registrar una {tipoSeleccionado.title.toLowerCase()}</h1><p>Completa los datos para que podamos identificar y tramitar tu solicitud.</p></div></div>
      <form className="create-form-panel" onSubmit={enviarPQRS}>
        <div className="create-form-summary"><div className={`create-form-type-icon type-icon-${tipoSlug(tipo)}`}><AppIcon name={tipoSeleccionado.icon} size={28}/></div><div><span className="portal-eyebrow">TIPO SELECCIONADO</span><h2>{tipoSeleccionado.title}</h2><p>{tipoSeleccionado.description}</p></div></div>
        {errorFormulario && <p className="portal-error" role="alert">{errorFormulario}</p>}
        <div className="create-form-grid">
          <label className="hv-field"><span>Nombre completo <b>*</b></span><input value={nombre} onChange={(event) => setNombre(event.target.value)} placeholder="Escribe tu nombre completo" autoComplete="name" required /></label>
          <label className="hv-field"><span>Número de identificación <b>*</b></span><input value={documento} onChange={(event) => setDocumento(event.target.value)} placeholder="Número de documento" autoComplete="off" required /></label>
          <label className="hv-field hv-field-full"><span>Correo electrónico <b>*</b></span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nombre@gmail.com" autoComplete="email" required /><small>Usaremos este correo para las comunicaciones relacionadas con tu solicitud.</small></label>
          <label className="hv-field hv-field-full"><span>Descripción de la solicitud <b>*</b></span><textarea value={descripcion} onChange={(event) => setDescripcion(event.target.value)} placeholder="Describe los hechos, la situación o la solicitud con el mayor detalle posible..." rows={6} maxLength={4000} required /><small className="field-character-count">{descripcion.length}/4000 caracteres</small></label>
          <div className="hv-field hv-field-full"><span>Documentos de soporte <small>(opcional)</small></span><label className="upload-dropzone"><input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.gif" onChange={(event) => setArchivo(event.target.files?.[0] || null)}/><span className="upload-dropzone-icon"><AppIcon name="paperclip" size={24}/></span><span><strong>{archivo ? archivo.name : "Adjunta un archivo de soporte"}</strong><small>{archivo ? "Archivo seleccionado" : "PDF o imagen · Selecciona un archivo desde tu dispositivo"}</small></span><span className="upload-dropzone-action">Examinar</span></label></div>
        </div>
        <div className="create-form-footer"><p><AppIcon name="shield" size={17}/> Revisa los datos antes de enviar. Los campos con * son obligatorios.</p><button type="submit" className="portal-button portal-button-primary create-submit" disabled={enviando}>{enviando ? "Registrando solicitud..." : "Enviar solicitud"}<AppIcon name="send" size={18}/></button></div>
      </form>
    </section>
  );
}

function VerPQRS({ usuario, onNavigate, onOpenTracking }) {
  const { notify, confirmAction } = useFeedback();
  const [pqrs, setPqrs] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [filtroAbierto, setFiltroAbierto] = useState(false);
  const filtroRef = useRef(null);
  const opcionesFiltro = [
    { value: "", label: "Todas las solicitudes" },
    { value: "PENDIENTE", label: "Pendientes" },
    { value: "PROCESO", label: "En trámite" },
    { value: "RESUELTO", label: "Resueltas" },
    { value: "CERRADO", label: "Cerradas" },
  ];
  const filtroActual = opcionesFiltro.find((opcion) => opcion.value === filtro) || opcionesFiltro[0];
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [editando, setEditando] = useState(null);
  const [descripcionEditada, setDescripcionEditada] = useState("");
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  const cargarPQRS = async () => {
    if (!usuario?.id && !usuario?._id) {
      setPqrs([]); setErrorCarga("No se encontró el usuario de la sesión. Inicia sesión nuevamente."); setCargando(false); return;
    }
    const activeToken = obtenerToken();
    if (!activeToken) { setPqrs([]); setErrorCarga("No se encontró el token de sesión. Inicia sesión nuevamente."); setCargando(false); return; }
    const idUsuario = usuario.id || usuario._id;
    const url = !filtro ? `${API_URL}/pqrs/usuario/${idUsuario}` : `${API_URL}/pqrs/usuario/${idUsuario}/estado?estado=${encodeURIComponent(filtro)}`;
    setCargando(true); setErrorCarga("");
    try {
      const response = await fetch(url, { headers: { Authorization: `Bearer ${activeToken}` } });
      if (!response.ok) {
        const detalle = await detalleErrorRespuesta(response);
        console.error("Error cargando PQRS:", response.status, detalle);
        setPqrs([]);
        setErrorCarga(response.status === 401 || response.status === 403 ? `El servidor rechazó la consulta (HTTP ${response.status}). Comprueba tu sesión y los permisos.` : `No fue posible cargar tus solicitudes (HTTP ${response.status}).`);
        return;
      }
      const data = await response.json();
      setPqrs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error de conexión al cargar PQRS:", error); setPqrs([]); setErrorCarga("No se pudieron cargar las solicitudes. Comprueba que el backend esté activo.");
    } finally { setCargando(false); }
  };

  useEffect(() => { cargarPQRS(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [filtro]);

  useEffect(() => {
    if (!filtroAbierto) return;

    const cerrarAlHacerClicFuera = (event) => {
      if (!filtroRef.current?.contains(event.target)) {
        setFiltroAbierto(false);
      }
    };

    const cerrarConEscape = (event) => {
      if (event.key === "Escape") setFiltroAbierto(false);
    };

    document.addEventListener("pointerdown", cerrarAlHacerClicFuera);
    document.addEventListener("keydown", cerrarConEscape);

    return () => {
      document.removeEventListener("pointerdown", cerrarAlHacerClicFuera);
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, [filtroAbierto]);

  const eliminarPQRS = async (item) => {
    const accepted = await confirmAction("Si confirmas, la solicitud se eliminará de tu listado. Esta acción no se puede deshacer desde esta pantalla.", {
      title: "¿Eliminar esta solicitud?", confirmLabel: "Eliminar solicitud", cancelLabel: "Conservar solicitud", tone: "danger",
      detail: `${item.tipo || "PQRS"} · ${obtenerCodigoVisible(item).value}`,
    });
    if (!accepted) return;
    const activeToken = obtenerToken();
    if (!activeToken) { await notify("No se encontró el token de sesión. Inicia sesión nuevamente.", { title: "Sesión no disponible", tone: "error" }); window.location.href = "/"; return; }
    try {
      const response = await fetch(`${API_URL}/pqrs/${encodeURIComponent(obtenerId(item))}`, { method: "DELETE", headers: encabezadosAutenticados() });
      if (!response.ok) { const detail = await detalleErrorRespuesta(response); await notify(`No se pudo eliminar la PQRS (HTTP ${response.status}). ${detail}`, { title: "No se pudo eliminar", tone: "error" }); return; }
      await notify("La solicitud se eliminó correctamente.", { title: "Acción completada", tone: "success" });
      await cargarPQRS();
    } catch (error) {
      console.error("Error al eliminar PQRS:", error); await notify("No se pudo conectar con el servidor para eliminar la solicitud.", { title: "Error de conexión", tone: "error" });
    }
  };

  const abrirEdicion = (item) => { setEditando(item); setDescripcionEditada(item.descripcion || ""); };

  const guardarEdicion = async (event) => {
    event.preventDefault();
    if (!editando) return;
    if (!descripcionEditada.trim()) { await notify("Escribe una descripción antes de actualizar la solicitud.", { title: "Descripción requerida", tone: "warning" }); return; }
    const activeToken = obtenerToken();
    if (!activeToken) { await notify("No se encontró el token de sesión. Inicia sesión nuevamente.", { title: "Sesión no disponible", tone: "error" }); window.location.href = "/"; return; }
    setGuardandoEdicion(true);
    try {
      const response = await fetch(`${API_URL}/pqrs/${encodeURIComponent(obtenerId(editando))}`, {
        method: "PUT", headers: encabezadosAutenticados({ "Content-Type": "application/json" }), body: JSON.stringify({ descripcion: descripcionEditada.trim() }),
      });
      if (!response.ok) { const detail = await detalleErrorRespuesta(response); await notify(`No se pudo actualizar la descripción (HTTP ${response.status}). ${detail}`, { title: "No se guardaron los cambios", tone: "error" }); return; }
      setEditando(null);
      await notify("La descripción de tu PQRS fue actualizada.", { title: "Cambios guardados", tone: "success" });
      await cargarPQRS();
    } catch (error) {
      console.error("Error editando PQRS:", error); await notify("Ocurrió un problema de conexión al actualizar la solicitud.", { title: "Error de conexión", tone: "error" });
    } finally { setGuardandoEdicion(false); }
  };

  return (
    <section className="my-requests-page">
      <div className="portal-page-heading requests-heading"><div><span className="portal-eyebrow">TU ACTIVIDAD</span><h1 className="portal-page-title-accent">Mis solicitudes</h1><p>Consulta el avance de tus PQRS, revisa sus detalles o actualiza su descripción.</p></div><button type="button" className="portal-button portal-button-primary" onClick={() => onNavigate?.("crear")}><AppIcon name="plus" size={18}/> Nueva solicitud</button></div>
      <div className="requests-toolbar">
        <div
          className={`requests-filter-wrap ${filtroAbierto ? "is-open" : ""}`}
          ref={filtroRef}
        >
          <button
            type="button"
            className={`requests-filter ${filtroAbierto ? "is-open" : ""}`}
            onClick={() => setFiltroAbierto((abierto) => !abierto)}
            aria-expanded={filtroAbierto}
            aria-haspopup="true"
            aria-controls="requests-filter-menu"
            aria-label={`Filtrar solicitudes. Seleccionado: ${filtroActual.label}`}
          >
            <AppIcon name="filter" size={18} />
            <span className="requests-filter-value">{filtroActual.label}</span>
            <AppIcon name="chevronDown" size={17} className="requests-filter-chevron" />
          </button>

          {filtroAbierto && (
            <div id="requests-filter-menu" className="requests-filter-menu" role="group" aria-label="Opciones de filtro">
              {opcionesFiltro.map((opcion) => {
                const seleccionado = filtro === opcion.value;
                return (
                  <button
                    key={opcion.value || "todas"}
                    type="button"
                    className={`requests-filter-option ${seleccionado ? "is-selected" : ""}`}
                    aria-pressed={seleccionado}
                    onClick={() => {
                      setFiltro(opcion.value);
                      setFiltroAbierto(false);
                    }}
                  >
                    <span>{opcion.label}</span>
                    {seleccionado && <span className="requests-filter-option-check" aria-hidden="true">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <span className="requests-count">{pqrs.length} {pqrs.length === 1 ? "solicitud" : "solicitudes"}</span>
      </div>
      {cargando ? <div className="portal-state-card"><span className="portal-spinner"/><strong>Cargando tus solicitudes</strong><p>Estamos consultando la información más reciente.</p></div>
        : errorCarga ? <div className="portal-state-card state-error"><span><AppIcon name="alert" size={26}/></span><strong>No pudimos cargar las solicitudes</strong><p>{errorCarga}</p><button type="button" className="portal-button" onClick={cargarPQRS}>Intentar de nuevo</button></div>
        : pqrs.length === 0 ? <div className="portal-state-card"><span className="portal-state-illustration"><AppIcon name="files" size={32}/></span><strong>Aún no tienes solicitudes</strong><p>Cuando registres una PQRS, aparecerá aquí para que puedas consultar su referencia y seguimiento.</p></div>
        : <div className="request-list">
          {pqrs.map((item) => {
            const code = obtenerCodigoVisible(item); const slug = tipoSlug(item.tipo); const requestId = obtenerId(item);
            const icon = TIPOS_PQRS.find((t) => t.value === item.tipo)?.icon || "fileText";
            return <article className={`request-card request-card-${slug}`} key={requestId || `${item.tipo}-${item.fecha}`}>
              <div className={`request-card-art art-${slug}`} aria-hidden="true"><span className="request-card-art-shape"/><span className="request-card-art-icon"><AppIcon name={icon} size={34}/></span></div>
              <div className="request-card-content">
                <span className="request-card-category">{String(item.tipo || "Solicitud").replaceAll("_", " ")}</span>
                <p className="request-card-description" title={item.descripcion || "Sin descripción"}>{item.descripcion || "Sin descripción disponible."}</p>
                <div className="request-card-meta"><span><AppIcon name="calendar" size={16}/>{formatearFecha(item.fecha)}</span><span className="request-card-code"><strong>{code.label}:</strong> {code.value}</span></div>
              </div>
              <div className="request-card-actions">
                <button type="button" className="request-action-tracking" onClick={() => onOpenTracking(item)}><AppIcon name="eye" size={18}/>Ver seguimiento</button>
                <button type="button" className="request-action-edit" onClick={() => abrirEdicion(item)}><AppIcon name="pencil" size={17}/>Editar</button>
                <button type="button" className="request-action-cancel" onClick={() => eliminarPQRS(item)}><AppIcon name="trash" size={17}/>Cancelar</button>
              </div>
            </article>;
          })}
        </div>}
      {editando && <div className="hv-modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !guardandoEdicion) setEditando(null); }}>
        <section className="hv-edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-request-title">
          <div className="hv-edit-modal-header"><span className="hv-edit-modal-icon"><AppIcon name="pencil" size={24}/></span><button type="button" className="hv-icon-close" aria-label="Cerrar edición" onClick={() => setEditando(null)}><AppIcon name="close" size={18}/></button></div>
          <span className="portal-eyebrow">ACTUALIZACIÓN DE SOLICITUD</span><h2 id="edit-request-title">Editar descripción</h2><p className="hv-edit-modal-intro">Actualiza la información de tu PQRS. Los cambios se guardarán en la solicitud existente.</p>
          <form onSubmit={guardarEdicion}><label className="hv-field"><span>Descripción de la solicitud</span><textarea rows={6} maxLength={4000} value={descripcionEditada} onChange={(event) => setDescripcionEditada(event.target.value)} autoFocus /></label><div className="hv-edit-modal-footer"><span>{descripcionEditada.length}/4000 caracteres</span><div><button type="button" className="portal-button" onClick={() => setEditando(null)} disabled={guardandoEdicion}>Cancelar</button><button type="submit" className="portal-button portal-button-primary" disabled={guardandoEdicion}>{guardandoEdicion ? "Actualizando..." : "Actualizar descripción"}</button></div></div></form>
        </section>
      </div>}
    </section>
  );
}

function Stats({ usuario }) {
  const [stats, setStats] = useState({});
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      const token = obtenerToken(); const userId = usuario?.id || usuario?._id;
      if (!token || !userId) { if (activo) { setError("No se encontró la sesión del usuario."); setCargando(false); } return; }
      try {
        const response = await fetch(`${API_URL}/pqrs/estadisticas/${encodeURIComponent(userId)}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json(); if (activo) setStats(data && typeof data === "object" ? data : {});
      } catch (requestError) { console.error("Error cargando estadísticas:", requestError); if (activo) setError(requestError.message || "No se pudieron cargar las estadísticas."); }
      finally { if (activo) setCargando(false); }
    };
    cargar(); return () => { activo = false; };
  }, [usuario?.id, usuario?._id]);

  const total = Number(stats.total || 0); const pendientes = Number(stats.pendientes || 0); const proceso = Number(stats.proceso || 0); const resueltas = Number(stats.resueltas || 0);
  const maxEstado = Math.max(pendientes, proceso, resueltas, 1);
  const p1 = total ? pendientes / total * 100 : 0;
  const p2 = total ? proceso / total * 100 : 0;
  const p3 = total ? resueltas / total * 100 : 0;
  const pStatusEnd = Math.min(p1 + p2 + p3, 100);
  const donutStyle = { background: total ? `conic-gradient(#f2c500 0 ${Math.min(p1, 100)}%, #4b91dc ${Math.min(p1, 100)}% ${Math.min(p1 + p2, 100)}%, #32a879 ${Math.min(p1 + p2, 100)}% ${pStatusEnd}%, #e1e7ef ${pStatusEnd}% 100%)` : "conic-gradient(#e1e7ef 0 100%)" };

  return <section className="user-stats-page">
    <div className="portal-page-heading"><div><span className="portal-eyebrow">RESUMEN PERSONAL</span><h1 className="portal-page-title-accent">Estadísticas</h1><p>Una vista clara del estado de tus solicitudes registradas.</p></div></div>
    {cargando ? <div className="portal-state-card"><span className="portal-spinner"/><strong>Cargando estadísticas</strong></div> : error ? <div className="portal-state-card state-error"><span><AppIcon name="alert" size={25}/></span><strong>No se pudieron cargar las estadísticas</strong><p>{error}</p><button className="portal-button" type="button" onClick={() => window.location.reload()}>Recargar vista</button></div> : <>
      <div className="stats-kpi-grid">
        <article className="stats-kpi stats-kpi-total"><span className="stats-kpi-icon"><AppIcon name="files" size={22}/></span><span className="stats-kpi-label">Total de solicitudes</span><strong>{total}</strong><small>Solicitudes registradas</small></article>
        <article className="stats-kpi stats-kpi-pending"><span className="stats-kpi-icon"><AppIcon name="clock" size={22}/></span><span className="stats-kpi-label">Pendientes</span><strong>{pendientes}</strong><small>Esperan atención</small></article>
        <article className="stats-kpi stats-kpi-progress"><span className="stats-kpi-icon"><AppIcon name="refresh" size={22}/></span><span className="stats-kpi-label">En trámite</span><strong>{proceso}</strong><small>En gestión</small></article>
        <article className="stats-kpi stats-kpi-resolved"><span className="stats-kpi-icon"><AppIcon name="checkCircle" size={22}/></span><span className="stats-kpi-label">Resueltas</span><strong>{resueltas}</strong><small>Con respuesta final</small></article>
      </div>
      <div className="stats-visual-grid">
        <section className="stats-panel"><div className="stats-panel-heading"><div><h2>Distribución por estado</h2><p>Participación de las solicitudes registradas</p></div><span className="stats-panel-tag">Actualizado</span></div><div className="stats-donut-layout"><div className="stats-donut" style={donutStyle}><div><strong>{total}</strong><span>solicitudes</span></div></div><div className="stats-legend"><span><i className="legend-pending"/>Pendientes <strong>{pendientes}</strong></span><span><i className="legend-progress"/>En trámite <strong>{proceso}</strong></span><span><i className="legend-resolved"/>Resueltas <strong>{resueltas}</strong></span></div></div></section>
        <section className="stats-panel"><div className="stats-panel-heading"><div><h2>Resumen comparativo</h2><p>Volumen por estado</p></div></div><div className="stats-bar-list"><div className="stats-bar-item"><div><span>Pendientes</span><strong>{pendientes}</strong></div><span className="stats-bar-track"><i className="bar-pending" style={{ width: `${pendientes / maxEstado * 100}%` }}/></span></div><div className="stats-bar-item"><div><span>En trámite</span><strong>{proceso}</strong></div><span className="stats-bar-track"><i className="bar-progress" style={{ width: `${proceso / maxEstado * 100}%` }}/></span></div><div className="stats-bar-item"><div><span>Resueltas</span><strong>{resueltas}</strong></div><span className="stats-bar-track"><i className="bar-resolved" style={{ width: `${resueltas / maxEstado * 100}%` }}/></span></div></div><div className="stats-panel-foot"><AppIcon name="info" size={16}/> Las cifras reflejan la información que entrega el sistema.</div></section>
      </div>
    </>}
  </section>;
}

function Perfil({ usuario, onUserUpdated }) {
  const { notify } = useFeedback();
  const [nombre, setNombre] = useState(usuario?.nombre || "");
  const [username, setUsername] = useState(usuario?.username || "");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(usuario?.avatarUrl || localStorage.getItem(`hoodvoice-avatar-${usuario?.id || usuario?._id || usuario?.username}`) || "");

  useEffect(() => { setNombre(usuario?.nombre || ""); setUsername(usuario?.username || ""); }, [usuario?.nombre, usuario?.username]);

  const guardarCambios = async (event) => {
    event.preventDefault(); setMensaje(""); setError("");
    const userId = usuario?.id || usuario?._id;
    if (!userId) { setError("No se encontró el usuario de la sesión."); return; }
    if (!nombre.trim() || !username.trim()) { setError("El nombre y el usuario son obligatorios."); return; }
    if (password && password.length < 4) { setError("La contraseña debe tener al menos 4 caracteres."); return; }
    const token = obtenerToken(); if (!token) { setError("No se encontró el token de sesión."); return; }
    setGuardando(true);
    try {
      const response = await fetch(`${API_URL}/test/actualizar/${encodeURIComponent(userId)}`, {
        method: "PUT", headers: encabezadosAutenticados({ "Content-Type": "application/json" }),
        body: JSON.stringify({ nombre: nombre.trim(), username: username.trim(), password }),
      });
      if (!response.ok) { const detail = await detalleErrorRespuesta(response); setError(`No se pudo actualizar el perfil (HTTP ${response.status}). ${detail}`); return; }
      let data = null; try { data = await response.json(); } catch { /* respuesta sin cuerpo */ }
      const updatedUser = { ...usuario, ...(data && typeof data === "object" ? data : {}), nombre: nombre.trim(), username: username.trim(), email: usuario?.email || usuario?.correo || "", avatarUrl: avatarUrl || usuario?.avatarUrl };
      localStorage.setItem("user", JSON.stringify(updatedUser)); onUserUpdated?.(updatedUser);
      setMensaje("Tus datos se actualizaron correctamente."); setPassword("");
      await notify("Los cambios de tu perfil fueron guardados.", { title: "Perfil actualizado", tone: "success" });
    } catch (requestError) { console.error("Error al actualizar perfil:", requestError); setError("No fue posible conectar con el servidor para actualizar el perfil."); }
    finally { setGuardando(false); }
  };

  const seleccionarFoto = async (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith("image/")) { await notify("Selecciona un archivo de imagen válido.", { title: "Formato no compatible", tone: "warning" }); return; }
    if (file.size > 5 * 1024 * 1024) { await notify("La imagen debe pesar menos de 5 MB.", { title: "Imagen demasiado grande", tone: "warning" }); return; }
    try {
      const dataUrl = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
      const img = await new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = dataUrl; });
      const size = 320; const scale = Math.min(size / img.width, size / img.height, 1); const canvas = document.createElement("canvas"); canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale); const context = canvas.getContext("2d"); context.drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressed = canvas.toDataURL("image/jpeg", 0.78); const storageKey = `hoodvoice-avatar-${usuario?.id || usuario?._id || usuario?.username}`;
      localStorage.setItem(storageKey, compressed); setAvatarUrl(compressed); const updated = { ...usuario, avatarUrl: compressed }; localStorage.setItem("user", JSON.stringify(updated)); onUserUpdated?.(updated);
      setMensaje("La foto de perfil se actualizó en este navegador.");
    } catch (photoError) { console.error("No se pudo procesar la foto:", photoError); await notify("No se pudo procesar la imagen. Intenta con otra fotografía.", { title: "Error al cargar la foto", tone: "error" }); }
    finally { event.target.value = ""; }
  };

  const iniciales = (nombre || username || "HV").split(/\s+/).slice(0, 2).map((x) => x[0]?.toUpperCase() || "").join("");
  return <section className="profile-page">
    <div className="portal-page-heading"><div><span className="portal-eyebrow">TU CUENTA</span><h1 className="portal-page-title-accent">Mi perfil</h1><p>Administra la información básica de tu cuenta HoodVoice.</p></div></div>
    <div className="profile-layout">
      <aside className="profile-summary-panel"><div className="profile-avatar-large">{avatarUrl ? <img src={avatarUrl} alt="Foto de perfil"/> : <span>{iniciales}</span>}</div><h2>{nombre || username || "Usuario"}</h2><p>@{username || "usuario"}</p><span className="profile-role-badge"><AppIcon name="user" size={15}/> Usuario de HoodVoice</span><label className="portal-button profile-photo-button"><AppIcon name="image" size={17}/> Cambiar foto<input type="file" accept="image/*" onChange={seleccionarFoto}/></label><small>La fotografía se guarda en este navegador.</small></aside>
      <form className="profile-form-panel" onSubmit={guardarCambios}><div className="profile-form-heading"><div><h2>Información personal</h2><p>Mantén tus datos actualizados para facilitar la gestión de tus solicitudes.</p></div><span className="profile-form-icon"><AppIcon name="user" size={22}/></span></div>
        {error && <p className="portal-error" role="alert">{error}</p>}{mensaje && <p className="portal-success" role="status">{mensaje}</p>}
        <div className="profile-form-grid"><label className="hv-field"><span>Nombre completo</span><input value={nombre} onChange={(event) => setNombre(event.target.value)} autoComplete="name" required/></label><label className="hv-field"><span>Nombre de usuario</span><input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required/></label><label className="hv-field hv-field-full"><span>Correo electrónico</span><div className="profile-email-row"><AppIcon name="mail" size={18}/><input value={usuario?.email || usuario?.correo || "Correo no disponible"} readOnly aria-readonly="true"/></div><small>El correo registrado se muestra aquí; la actualización del correo requerirá soporte del backend.</small></label><label className="hv-field hv-field-full"><span>Nueva contraseña <small>(opcional)</small></span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Deja este campo vacío para conservarla" autoComplete="new-password"/><small>Por seguridad, la contraseña actual no se muestra.</small></label></div>
        <div className="profile-form-footer"><span><AppIcon name="shield" size={17}/> Tus datos de cuenta se manejan de forma privada.</span><button type="submit" className="portal-button portal-button-primary" disabled={guardando}>{guardando ? "Guardando..." : "Guardar cambios"}<AppIcon name="check" size={18}/></button></div>
      </form>
    </div>
  </section>;
}
