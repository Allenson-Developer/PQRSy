import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import AppIcon from "../components/AppIcon";
import { useFeedback } from "../components/FeedbackProvider";
import "./adminDashboard.css";

function AdminDashboard() {
  const [vista, setVista] = useState("inicio");
  const [usuario, setUsuario] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); }
    catch { return null; }
  });
  const { confirmAction } = useFeedback();

  useEffect(() => {
    if (!usuario || String(usuario.role || "").toUpperCase() !== "ADMIN") {
      window.location.href = "/";
    }
  }, [usuario]);

  const logout = async () => {
    const confirmado = await confirmAction("Se cerrará tu sesión administrativa y volverás a la pantalla de bienvenida.", {
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

  return (
    <div className="portal-shell admin-portal">
      <Navbar role="ADMIN" user={usuario} activeView={vista} onNavigate={setVista} onLogout={logout} />
      <main className="portal-main admin-main">
        {vista === "inicio" && <AdminInicio onNavigate={setVista} usuario={usuario} />}
        {vista === "ver" && <AdminPQRS />}
        {vista === "stats" && <AdminStats />}
      </main>
      <footer className="portal-footer"><span>HOODVOICE <b>CARTAGENA</b></span><span>Centro de gestión y atención de PQRS.</span></footer>
    </div>
  );
}

function AdminInicio({ onNavigate, usuario }) {
  const cards = [
    { view: "ver", title: "Todas las PQRS", text: "Consulta, filtra y revisa las solicitudes recibidas.", icon: "files", kind: "admin-card-requests", action: "Abrir bandeja" },
    { view: "stats", title: "Estadísticas globales", text: "Conoce la distribución general de las solicitudes.", icon: "chart", kind: "admin-card-stats", action: "Ver estadísticas" },
  ];
  return (
    <section className="admin-home-page">
      <div className="admin-welcome-banner">
        <div><span className="portal-eyebrow">CENTRO DE ADMINISTRACIÓN</span><h1>Bienvenido, {usuario?.nombre?.split(" ")[0] || usuario?.username || "administrador"}</h1><p>Supervisa las solicitudes y acompaña su gestión desde un solo espacio.</p></div>
        <div className="admin-welcome-mark"><AppIcon name="shield" size={48}/><span>HV</span></div>
      </div>
      <div className="portal-section-heading"><div><span className="portal-eyebrow">HERRAMIENTAS DE GESTIÓN</span><h2>¿Qué necesitas revisar?</h2><p>Accesos directos para las tareas administrativas.</p></div></div>
      <div className="admin-feature-row">
        {cards.map((card) => <button type="button" key={card.view} className={`admin-feature-card ${card.kind}`} onClick={() => onNavigate(card.view)}>
          <span className="admin-feature-art"><AppIcon name={card.icon} size={39}/><span className="admin-feature-arrow"><AppIcon name="chevronRight" size={18}/></span></span>
          <span className="admin-feature-copy"><strong>{card.title}</strong><small>{card.text}</small><span>{card.action}<AppIcon name="chevronRight" size={15}/></span></span>
        </button>)}
      </div>
      <section className="admin-home-note"><span><AppIcon name="shield" size={21}/></span><div><strong>Gestión responsable</strong><p>Verifica la información de cada caso antes de actualizar su estado o enviar una respuesta oficial.</p></div></section>
    </section>
  );
}

function AdminPQRS() {
  const [pqrs, setPqrs] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");

  const cargarPqrs = async () => {
    try {
      setLoading(true);
      setErrorCarga("");

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No se encontró el token de sesión. Inicia sesión nuevamente.");
      }

      const url = !filtro
        ? "http://localhost:8080/pqrs/todas"
        : `http://localhost:8080/pqrs/estado?estado=${encodeURIComponent(filtro)}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const detalle = await response.text();
        throw new Error(`HTTP ${response.status}${detalle ? `: ${detalle}` : ""}`);
      }

      const data = await response.json();
      setPqrs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando PQRS:", error);
      setErrorCarga(error.message || "No se pudieron cargar las PQRS.");
      setPqrs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPqrs();
    // La consulta depende del filtro de estado, que ya se enviaba al backend.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro]);

  const normalizar = (valor) => String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_-]/g, "")
    .toUpperCase();

  const obtenerClaseEstado = (estado) => {
    const valor = String(estado || "").toLowerCase();
    if (valor.includes("pend")) return "pendiente";
    if (valor.includes("proceso") || valor.includes("revision")) return "proceso";
    if (valor.includes("resuelto")) return "resuelto";
    if (valor.includes("cerrado")) return "cerrado";
    return "";
  };

  const formatearEstado = (estado) => {
    switch (String(estado || "").toUpperCase()) {
      case "PENDIENTE": return "Pendiente";
      case "PROCESO": return "En trámite";
      case "RESUELTO": return "Resuelta";
      case "CERRADO": return "Cerrada";
      default: return estado || "Sin estado";
    }
  };

  const formatearTipo = (tipo) => {
    const valor = normalizar(tipo);
    const nombres = {
      PETICION: "Petición",
      QUEJA: "Queja",
      RECLAMO: "Reclamo",
      SUGERENCIA: "Sugerencia",
      FELICITACION: "Felicitación",
      DENUNCIA: "Denuncia",
    };
    return nombres[valor] || String(tipo || "Solicitud").replaceAll("_", " ");
  };

  const obtenerSlugTipo = (tipo) => {
    const valor = normalizar(tipo);
    if (valor.includes("PETICION")) return "peticion";
    if (valor.includes("QUEJA")) return "queja";
    if (valor.includes("RECLAMO")) return "reclamo";
    if (valor.includes("SUGERENCIA")) return "sugerencia";
    if (valor.includes("FELICITACION")) return "felicitacion";
    if (valor.includes("DENUNCIA")) return "denuncia";
    return "general";
  };

  const obtenerIconoTipo = (tipo) => {
    const iconos = {
      peticion: "fileText",
      queja: "hand",
      reclamo: "megaphone",
      sugerencia: "lightbulb",
      felicitacion: "star",
      denuncia: "shield",
      general: "files",
    };
    return iconos[obtenerSlugTipo(tipo)];
  };

  const obtenerReferencia = (item) => String(
    item.codigoPQRS || item.codigoPqrs || item.codigo || item.numeroRadicado || item.id || item._id || "Pendiente"
  );

  const pqrsFiltradas = pqrs.filter((item) => {
    const consulta = busqueda.trim().toLocaleLowerCase("es-CO");
    const valoresBusqueda = [
      obtenerReferencia(item), item.tipo, item.nombre, item.username,
      item.descripcion, item.agenteAsignado,
    ].filter(Boolean).join(" ").toLocaleLowerCase("es-CO");
    const coincideTexto = !consulta || valoresBusqueda.includes(consulta);
    const coincideTipo = !filtroTipo || normalizar(item.tipo) === filtroTipo;
    return coincideTexto && coincideTipo;
  });

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroTipo("");
    setFiltro("");
  };

  const hayFiltrosActivos = Boolean(busqueda.trim() || filtroTipo || filtro);

  return (
    <section className="admin-pqrs-inbox">
      <header className="admin-inbox-heading">
        <div>
          <span className="admin-inbox-eyebrow">GESTIÓN Y SEGUIMIENTO</span>
          <h1>Todas las PQRS</h1>
          <p>Consulta, filtra y gestiona las solicitudes ciudadanas desde un solo lugar.</p>
        </div>
        {!loading && !errorCarga && (
          <div className="admin-inbox-total" aria-live="polite">
            <strong>{pqrsFiltradas.length}</strong>
            <span>{pqrsFiltradas.length === 1 ? "solicitud" : "solicitudes"}</span>
          </div>
        )}
      </header>

      <div className="admin-inbox-toolbar">
        <label className="admin-inbox-search">
          <AppIcon name="search" size={18} />
          <input
            type="search"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar por expediente, usuario o descripción..."
            aria-label="Buscar PQRS"
          />
        </label>

        <label className="admin-inbox-select">
          <AppIcon name="filter" size={17} />
          <select value={filtroTipo} onChange={(event) => setFiltroTipo(event.target.value)} aria-label="Filtrar por tipo de PQRS">
            <option value="">Todos los tipos</option>
            <option value="PETICION">Peticiones</option>
            <option value="QUEJA">Quejas</option>
            <option value="RECLAMO">Reclamos</option>
            <option value="SUGERENCIA">Sugerencias</option>
            <option value="FELICITACION">Felicitaciones</option>
            <option value="DENUNCIA">Denuncias</option>
          </select>
          <AppIcon name="chevronDown" size={16} />
        </label>

        <label className="admin-inbox-select">
          <AppIcon name="filter" size={17} />
          <select value={filtro} onChange={(event) => setFiltro(event.target.value)} aria-label="Filtrar por estado de PQRS">
            <option value="">Todos los estados</option>
            <option value="PENDIENTE">Pendientes</option>
            <option value="PROCESO">En trámite</option>
            <option value="RESUELTO">Resueltas</option>
            <option value="CERRADO">Cerradas</option>
          </select>
          <AppIcon name="chevronDown" size={16} />
        </label>

        <button type="button" className="admin-inbox-clear" onClick={limpiarFiltros} disabled={!hayFiltrosActivos}>
          Limpiar
        </button>
      </div>

      <div className="admin-inbox-list-label">
        <span>{loading ? "Consultando solicitudes..." : "Bandeja de solicitudes"}</span>
        {!loading && !errorCarga && (
          <span>{pqrsFiltradas.length} de {pqrs.length} visibles</span>
        )}
      </div>

      {loading && (
        <div className="admin-inbox-state" role="status">
          <span className="portal-spinner" />
          <strong>Cargando solicitudes</strong>
          <p>Estamos consultando la información más reciente.</p>
        </div>
      )}

      {!loading && errorCarga && (
        <div className="admin-inbox-state admin-inbox-state-error" role="alert">
          <AppIcon name="alert" size={28} />
          <strong>No se pudieron cargar las PQRS</strong>
          <p>{errorCarga}</p>
          <button type="button" className="admin-inbox-clear" onClick={cargarPqrs}>Intentar de nuevo</button>
        </div>
      )}

      {!loading && !errorCarga && pqrs.length === 0 && (
        <div className="admin-inbox-state">
          <AppIcon name="files" size={30} />
          <strong>No hay PQRS para mostrar</strong>
          <p>Cuando se registren solicitudes, aparecerán aquí para que puedas gestionarlas.</p>
        </div>
      )}

      {!loading && !errorCarga && pqrs.length > 0 && pqrsFiltradas.length === 0 && (
        <div className="admin-inbox-state">
          <AppIcon name="search" size={30} />
          <strong>No encontramos coincidencias</strong>
          <p>Prueba con otro texto o limpia los filtros para ver todas las solicitudes.</p>
          <button type="button" className="admin-inbox-clear" onClick={limpiarFiltros}>Limpiar filtros</button>
        </div>
      )}

      {!loading && !errorCarga && pqrsFiltradas.length > 0 && (
        <div className="admin-pqrs-list">
          {pqrsFiltradas.map((item, index) => {
            const requestId = item.id || item._id || "";
            const referencia = obtenerReferencia(item);
            const fecha = item.fecha ? new Date(item.fecha) : null;
            const fechaValida = fecha && !Number.isNaN(fecha.getTime());
            const nombreTipo = formatearTipo(item.tipo);
            const slugTipo = obtenerSlugTipo(item.tipo);

            return (
              <article className={`admin-inbox-item tipo-${slugTipo}`} key={requestId || `${item.tipo}-${item.fecha}-${index}`}>
                <span className={`admin-inbox-type-icon admin-inbox-type-${slugTipo}`} aria-hidden="true">
                  <AppIcon name={obtenerIconoTipo(item.tipo)} size={21} />
                </span>

                <div className="admin-inbox-item-main">
                  <div className="admin-inbox-item-titleline">
                    <h2>{nombreTipo}</h2>
                    <span className="admin-inbox-reference" title={`Expediente #${referencia}`}>#{referencia}</span>
                  </div>
                  <p className="admin-inbox-description" title={item.descripcion || "Sin descripción disponible"}>
                    {item.descripcion || "Sin descripción disponible."}
                  </p>
                  <div className="admin-inbox-item-meta">
                    <span><AppIcon name="user" size={14} /><strong>{item.nombre || "Sin nombre"}</strong>{item.username ? <small>@{item.username}</small> : null}</span>
                    {item.agenteAsignado && <span><AppIcon name="user" size={14} />Asignado a {item.agenteAsignado}</span>}
                    {item.archivo && <span><AppIcon name="paperclip" size={14} />Archivo adjunto</span>}
                  </div>
                </div>

                <div className="admin-inbox-item-facts">
                  <span className={`admin-inbox-status ${obtenerClaseEstado(item.estado)}`}>
                    <span aria-hidden="true" />{formatearEstado(item.estado)}
                  </span>
                  <span className="admin-inbox-date">
                    <AppIcon name="calendar" size={15} />
                    <span>
                      <strong>{fechaValida ? fecha.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "Fecha no disponible"}</strong>
                      {fechaValida && <small>{fecha.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" })}</small>}
                    </span>
                  </span>
                </div>

                <div className="admin-inbox-item-actions">
                  <button
                    type="button"
                    className="admin-inbox-manage-btn"
                    disabled={!requestId}
                    onClick={() => { window.location.href = `/detalle-admin/${encodeURIComponent(requestId)}`; }}
                  >
                    Gestionar trámite <AppIcon name="chevronRight" size={17} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

//////////////////////////////////////////////////////

// DASHBOARD STATS

//////////////////////////////////////////////////////

function AdminStats() {
  const { notify } = useFeedback();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Tu sesión ha expirado. Inicia sesión nuevamente.");
      setLoading(false);
      return () => { activo = false; };
    }
    fetch("http://localhost:8080/pqrs/estadisticas-global", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const detail = await res.text();
          throw new Error(`HTTP ${res.status}${detail ? `: ${detail}` : ""}`);
        }
        return res.json();
      })
      .then((data) => { if (activo) setStats(data || {}); })
      .catch((requestError) => {
        console.error("Error cargando estadísticas globales:", requestError);
        if (activo) setError(requestError.message || "Error cargando estadísticas globales.");
      })
      .finally(() => { if (activo) setLoading(false); });
    return () => { activo = false; };
  }, []);

  const total = Number(stats.total || 0);
  const pendientes = Number(stats.pendientes || 0);
  const proceso = Number(stats.proceso || 0);
  const resueltas = Number(stats.resueltas || 0);
  const maxEstado = Math.max(pendientes, proceso, resueltas, 1);
  const p1 = total ? pendientes / total * 100 : 0;
  const p2 = total ? proceso / total * 100 : 0;
  const p3 = total ? resueltas / total * 100 : 0;
  const pStatusEnd = Math.min(p1 + p2 + p3, 100);
  const donutStyle = { background: total ? `conic-gradient(#f2c500 0 ${Math.min(p1, 100)}%, #4b91dc ${Math.min(p1, 100)}% ${Math.min(p1 + p2, 100)}%, #32a879 ${Math.min(p1 + p2, 100)}% ${pStatusEnd}%, #e1e7ef ${pStatusEnd}% 100%)` : "conic-gradient(#e1e7ef 0 100%)" };

  return (
    <section className="admin-stats-page">
      <div className="portal-page-heading"><div><span className="portal-eyebrow">MONITOREO DEL SISTEMA</span><h1 className="portal-page-title-accent">Estadísticas globales</h1><p>Resumen general de las solicitudes registradas en HoodVoice Cartagena.</p></div></div>
      {loading ? <div className="portal-state-card"><span className="portal-spinner"/><strong>Cargando estadísticas globales</strong></div> : error ? <div className="portal-state-card state-error"><span><AppIcon name="alert" size={25}/></span><strong>No se pudieron cargar las estadísticas</strong><p>{error}</p><button type="button" className="portal-button" onClick={() => window.location.reload()}>Recargar vista</button></div> : <>
        <div className="stats-kpi-grid admin-stats-kpis">
          <article className="stats-kpi stats-kpi-total"><span className="stats-kpi-icon"><AppIcon name="files" size={22}/></span><span className="stats-kpi-label">Total de PQRS</span><strong>{total}</strong><small>Solicitudes registradas</small></article>
          <article className="stats-kpi stats-kpi-pending"><span className="stats-kpi-icon"><AppIcon name="clock" size={22}/></span><span className="stats-kpi-label">Pendientes</span><strong>{pendientes}</strong><small>Esperan revisión</small></article>
          <article className="stats-kpi stats-kpi-progress"><span className="stats-kpi-icon"><AppIcon name="refresh" size={22}/></span><span className="stats-kpi-label">En trámite</span><strong>{proceso}</strong><small>En gestión</small></article>
          <article className="stats-kpi stats-kpi-resolved"><span className="stats-kpi-icon"><AppIcon name="checkCircle" size={22}/></span><span className="stats-kpi-label">Resueltas</span><strong>{resueltas}</strong><small>Con gestión finalizada</small></article>
        </div>
        <div className="stats-visual-grid">
          <section className="stats-panel"><div className="stats-panel-heading"><div><h2>Distribución por estado</h2><p>Proporción del total de solicitudes</p></div><span className="stats-panel-tag">Vista global</span></div><div className="stats-donut-layout"><div className="stats-donut" style={donutStyle}><div><strong>{total}</strong><span>PQRS totales</span></div></div><div className="stats-legend"><span><i className="legend-pending"/>Pendientes <strong>{pendientes}</strong></span><span><i className="legend-progress"/>En trámite <strong>{proceso}</strong></span><span><i className="legend-resolved"/>Resueltas <strong>{resueltas}</strong></span></div></div></section>
          <section className="stats-panel"><div className="stats-panel-heading"><div><h2>Comparativo por estado</h2><p>Volumen registrado por categoría</p></div></div><div className="stats-bar-list"><div className="stats-bar-item"><div><span>Pendientes</span><strong>{pendientes}</strong></div><span className="stats-bar-track"><i className="bar-pending" style={{ width: `${pendientes / maxEstado * 100}%` }}/></span></div><div className="stats-bar-item"><div><span>En trámite</span><strong>{proceso}</strong></div><span className="stats-bar-track"><i className="bar-progress" style={{ width: `${proceso / maxEstado * 100}%` }}/></span></div><div className="stats-bar-item"><div><span>Resueltas</span><strong>{resueltas}</strong></div><span className="stats-bar-track"><i className="bar-resolved" style={{ width: `${resueltas / maxEstado * 100}%` }}/></span></div></div><div className="stats-panel-foot"><AppIcon name="info" size={16}/> Los indicadores se calculan con los datos del backend.</div></section>
        </div>
      </>}
    </section>
  );
}

export default AdminDashboard;
