import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import AppIcon from "../components/AppIcon";
import { useFeedback } from "../components/FeedbackProvider";
import "./adminDashboard.css";

const API_URL = "https://hoodvoice-api.onrender.com";

function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const vista = location.state?.adminDashboardView || "inicio";
  const cambiarVista = (siguienteVista, replace = false) => {
    if (siguienteVista === vista) return;

    navigate(location.pathname, {
      replace,
      state: {
        ...(location.state && typeof location.state === "object" ? location.state : {}),
        adminDashboardView: siguienteVista,
      },
    });
  };
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
      <Navbar role="ADMIN" user={usuario} activeView={vista} onNavigate={cambiarVista} onLogout={logout} />
      <main className="portal-main admin-main">
        {vista === "inicio" && <AdminInicio onNavigate={cambiarVista} usuario={usuario} />}
        {vista === "ver" && <AdminPQRS />}
        {vista === "asignadas" && <AdminPQRS soloAsignadas />}
        {vista === "stats" && <AdminStats />}
      </main>
      <footer className="portal-footer"><span>HOODVOICE <b>CARTAGENA</b></span><span>Centro de gestión y atención de PQRS.</span></footer>
    </div>
  );
}

function AdminInicio({ onNavigate, usuario }) {
  const cards = [
    { view: "ver", title: "Todas las PQRS", text: "Consulta, filtra y revisa las solicitudes recibidas.", icon: "files", kind: "admin-card-requests", action: "Abrir bandeja" },
    { view: "asignadas", title: "Mis PQRS asignadas", text: "Encuentra rápidamente las solicitudes que están bajo tu responsabilidad.", icon: "user", kind: "admin-card-assigned", action: "Ver mis asignaciones" },
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


function AdminInboxFilter({ id, ariaLabel, value, options, onChange }) {
  const [abierto, setAbierto] = useState(false);
  const filtroRef = useRef(null);
  const opcionActual = options.find((opcion) => opcion.value === value) || options[0];

  useEffect(() => {
    if (!abierto) return;

    const cerrarAlHacerClicFuera = (event) => {
      if (!filtroRef.current?.contains(event.target)) {
        setAbierto(false);
      }
    };

    const cerrarConEscape = (event) => {
      if (event.key === "Escape") setAbierto(false);
    };

    document.addEventListener("pointerdown", cerrarAlHacerClicFuera);
    document.addEventListener("keydown", cerrarConEscape);

    return () => {
      document.removeEventListener("pointerdown", cerrarAlHacerClicFuera);
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, [abierto]);

  return (
    <div
      className={`admin-inbox-filter-wrap ${abierto ? "is-open" : ""}`}
      ref={filtroRef}
    >
      <button
        type="button"
        className={`admin-inbox-filter ${abierto ? "is-open" : ""}`}
        onClick={() => {
          const abrir = !abierto;
          setAbierto(abrir);
          if (abrir && !loading) onOpen?.();
        }}
        aria-expanded={abierto}
        aria-haspopup="true"
        aria-controls={`${id}-menu`}
        aria-label={`${ariaLabel}. Seleccionado: ${opcionActual.label}`}
      >
        <AppIcon name="filter" size={17} />
        <span className="admin-inbox-filter-value">{opcionActual.label}</span>
        <AppIcon name="chevronDown" size={16} className="admin-inbox-filter-chevron" />
      </button>

      {abierto && (
        <div
          id={`${id}-menu`}
          className="admin-inbox-filter-menu"
          role="group"
          aria-label="Opciones de filtro"
        >
          {options.map((opcion) => {
            const seleccionado = value === opcion.value;
            return (
              <button
                key={opcion.value || "todos"}
                type="button"
                className={`admin-inbox-filter-option ${seleccionado ? "is-selected" : ""}`}
                aria-pressed={seleccionado}
                onClick={() => {
                  onChange(opcion.value);
                  setAbierto(false);
                }}
              >
                <span>{opcion.label}</span>
                {seleccionado && (
                  <span className="admin-inbox-filter-option-check" aria-hidden="true">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}


function AdminAssigneePicker({ admins, value, onChange, loading, error, onRetry, onOpen }) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const pickerRef = useRef(null);
  const seleccionado = admins.find((admin) => admin.id === value);
  const administradoresFiltrados = admins.filter((admin) => {
    const consulta = busqueda.trim().toLocaleLowerCase("es-CO");
    const texto = `${admin.nombre || ""} ${admin.username || ""}`.toLocaleLowerCase("es-CO");
    return !consulta || texto.includes(consulta);
  });

  useEffect(() => {
    if (!abierto) return undefined;

    const cerrarAlHacerClicFuera = (event) => {
      if (!pickerRef.current?.contains(event.target)) setAbierto(false);
    };
    const cerrarConEscape = (event) => {
      if (event.key === "Escape") setAbierto(false);
    };

    document.addEventListener("pointerdown", cerrarAlHacerClicFuera);
    document.addEventListener("keydown", cerrarConEscape);
    return () => {
      document.removeEventListener("pointerdown", cerrarAlHacerClicFuera);
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, [abierto]);

  return (
    <div className={`admin-assignee-picker ${abierto ? "is-open" : ""}`} ref={pickerRef}>
      <button
        type="button"
        className={`admin-assignee-picker-trigger ${abierto ? "is-open" : ""}`}
        onClick={() => setAbierto((actual) => !actual)}
        aria-expanded={abierto}
        aria-haspopup="listbox"
        aria-label={`Ver solicitudes de: ${seleccionado?.nombre || "selecciona un administrador"}`}
      >
        <AppIcon name="user" size={18} />
        <span className={seleccionado ? "is-selected" : "is-placeholder"}>
          {loading ? "Cargando administradores..." : (seleccionado?.nombre || "Selecciona un administrador")}
        </span>
        <AppIcon name="chevronDown" size={17} className="admin-assignee-picker-chevron" />
      </button>

      {abierto && (
        <div className="admin-assignee-picker-menu">
          <label className="admin-assignee-picker-search">
            <AppIcon name="search" size={16} />
            <input
              type="search"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar por nombre o usuario..."
              aria-label="Buscar administrador"
              autoFocus
            />
          </label>

          {loading ? (
            <div className="admin-assignee-picker-message">Cargando administradores...</div>
          ) : error ? (
            <div className="admin-assignee-picker-message is-error">
              <span>{error}</span>
              <button type="button" onClick={onRetry}>Intentar de nuevo</button>
            </div>
          ) : administradoresFiltrados.length > 0 ? (
            <div className="admin-assignee-picker-options" role="listbox" aria-label="Administradores activos">
              {administradoresFiltrados.map((admin) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={value === admin.id}
                  key={admin.id}
                  className={`admin-assignee-picker-option ${value === admin.id ? "is-selected" : ""}`}
                  onClick={() => {
                    onChange(admin.id);
                    setAbierto(false);
                    setBusqueda("");
                  }}
                >
                  <span className="admin-assignee-picker-avatar" aria-hidden="true">
                    {String(admin.nombre || admin.username || "A").trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="admin-assignee-picker-option-copy">
                    <strong>{admin.nombre || admin.username}</strong>
                    {admin.username && <small>@{admin.username}</small>}
                  </span>
                  {value === admin.id && <span className="admin-assignee-picker-check" aria-hidden="true">✓</span>}
                </button>
              ))}
            </div>
          ) : (
            <div className="admin-assignee-picker-message">
              {admins.length ? "No encontramos administradores con esa búsqueda." : "No hay administradores activos para mostrar."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AdminPQRS({ soloAsignadas = false }) {
  const navigate = useNavigate();
  const usuarioSesion = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); }
    catch { return null; }
  })();
  const claveAdminSeleccionado = `hoodvoice-admin-seleccionado-${usuarioSesion?.id || usuarioSesion?._id || usuarioSesion?.username || "sesion"}`;

  const [pqrs, setPqrs] = useState([]);
  const [administradores, setAdministradores] = useState([]);
  const [loadingAdministradores, setLoadingAdministradores] = useState(false);
  const [errorAdministradores, setErrorAdministradores] = useState("");
  const [adminSeleccionadoId, setAdminSeleccionadoId] = useState(() => {
    try { return sessionStorage.getItem(claveAdminSeleccionado) || ""; }
    catch { return ""; }
  });
  const [filtro, setFiltro] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");

  // Mantiene la selección cuando se abre una PQRS y se vuelve a la bandeja.
  useEffect(() => {
    try {
      if (adminSeleccionadoId) sessionStorage.setItem(claveAdminSeleccionado, adminSeleccionadoId);
      else sessionStorage.removeItem(claveAdminSeleccionado);
    } catch (error) {
      console.warn("No se pudo conservar el administrador seleccionado:", error);
    }
  }, [adminSeleccionadoId, claveAdminSeleccionado]);

  const opcionesTipo = [
    { value: "", label: "Todos los tipos" },
    { value: "PETICION", label: "Peticiones" },
    { value: "QUEJA", label: "Quejas" },
    { value: "RECLAMO", label: "Reclamos" },
    { value: "SUGERENCIA", label: "Sugerencias" },
    { value: "FELICITACION", label: "Felicitaciones" },
    { value: "DENUNCIA", label: "Denuncias" },
  ];
  const opcionesEstado = [
    { value: "", label: "Todos los estados" },
    { value: "PENDIENTE", label: "Pendientes" },
    { value: "PROCESO", label: "En trámite" },
    { value: "RESUELTO", label: "Resueltas" },
    { value: "CERRADO", label: "Cerradas" },
  ];

  const cargarAdministradores = useCallback(async () => {
    if (!soloAsignadas) return;

    try {
      setLoadingAdministradores(true);
      setErrorAdministradores("");
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No se encontró el token de sesión. Inicia sesión nuevamente.");

      const response = await fetch(`${API_URL}/test/admins-activos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const detalle = await response.text();
        throw new Error(`HTTP ${response.status}${detalle ? `: ${detalle}` : ""}`);
      }

      const data = await response.json();
      const lista = (Array.isArray(data) ? data : []).map((admin) => ({
        id: admin.id || admin._id,
        nombre: admin.nombreVisible || [admin.nombre, admin.apellido].filter(Boolean).join(" ").trim() || admin.username,
        username: admin.username || "",
      })).filter((admin) => admin.id);
      setAdministradores(lista);
      setAdminSeleccionadoId((actual) => actual && !lista.some((admin) => admin.id === actual) ? "" : actual);
    } catch (error) {
      console.error("Error cargando administradores activos:", error);
      setErrorAdministradores(error.message || "No se pudieron cargar los administradores.");
      setAdministradores([]);
    } finally {
      setLoadingAdministradores(false);
    }
  }, [soloAsignadas]);

  const cargarPqrs = useCallback(async () => {
    if (soloAsignadas && !adminSeleccionadoId) {
      setPqrs([]);
      setErrorCarga("");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorCarga("");

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No se encontró el token de sesión. Inicia sesión nuevamente.");
      }

      const url = soloAsignadas
        ? `${API_URL}/pqrs/asignadas/${encodeURIComponent(adminSeleccionadoId)}`
        : `${API_URL}/pqrs/todas`;

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
  }, [soloAsignadas, adminSeleccionadoId]);

  useEffect(() => {
    if (soloAsignadas) cargarAdministradores();
  }, [soloAsignadas, cargarAdministradores]);

  useEffect(() => {
    cargarPqrs();
  }, [cargarPqrs]);

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
    const coincideEstado = !filtro || normalizar(item.estado) === filtro;
    return coincideTexto && coincideTipo && coincideEstado;
  });

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroTipo("");
    setFiltro("");
  };

  const hayFiltrosActivos = Boolean(busqueda.trim() || filtroTipo || filtro);
  const administradoresOrdenados = [...administradores].sort((a, b) =>
    String(a.nombre || a.username || "").localeCompare(String(b.nombre || b.username || ""), "es", { sensitivity: "base" })
  );
  const administradorSeleccionado = administradores.find((admin) => admin.id === adminSeleccionadoId);

  return (
    <section className="admin-pqrs-inbox">
      <header className="admin-inbox-heading">
        <div>
          <span className="admin-inbox-eyebrow">{soloAsignadas ? "BANDEJA COMPARTIDA POR RESPONSABLE" : "GESTIÓN Y SEGUIMIENTO"}</span>
          <h1>{soloAsignadas ? "Mis PQRS asignadas" : "Todas las PQRS"}</h1>
          <p>{soloAsignadas ? "Selecciona un administrador para consultar las solicitudes que tiene a su cargo." : "Consulta, filtra y gestiona las solicitudes ciudadanas desde un solo lugar."}</p>
        </div>
        {!loading && !errorCarga && (!soloAsignadas || adminSeleccionadoId) && (
          <div className="admin-inbox-total" aria-live="polite">
            <strong>{soloAsignadas ? pqrs.length : pqrsFiltradas.length}</strong>
            <span>{soloAsignadas ? "PQRS asignadas" : (pqrsFiltradas.length === 1 ? "solicitud" : "solicitudes")}</span>
          </div>
        )}
      </header>

      {soloAsignadas && (
        <div className="admin-assigned-selector-row">
          <label className="admin-assigned-selector-label">VER SOLICITUDES DE</label>
          <AdminAssigneePicker
            admins={administradoresOrdenados}
            value={adminSeleccionadoId}
            onChange={setAdminSeleccionadoId}
            loading={loadingAdministradores}
            error={errorAdministradores}
            onRetry={cargarAdministradores}
            onOpen={cargarAdministradores}
          />
        </div>
      )}

      {soloAsignadas && errorAdministradores && (
        <div className="admin-inbox-state admin-inbox-state-error" role="alert">
          <AppIcon name="alert" size={26} />
          <strong>No se pudieron cargar los administradores</strong>
          <p>{errorAdministradores}</p>
          <button type="button" className="admin-inbox-clear" onClick={cargarAdministradores}>Intentar de nuevo</button>
        </div>
      )}

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

        <AdminInboxFilter
          id="admin-filter-tipo"
          ariaLabel="Filtrar por tipo de PQRS"
          value={filtroTipo}
          options={opcionesTipo}
          onChange={setFiltroTipo}
        />

        <AdminInboxFilter
          id="admin-filter-estado"
          ariaLabel="Filtrar por estado de PQRS"
          value={filtro}
          options={opcionesEstado}
          onChange={setFiltro}
        />

        <button type="button" className="admin-inbox-clear" onClick={limpiarFiltros} disabled={!hayFiltrosActivos}>
          Limpiar
        </button>
      </div>

      <div className="admin-inbox-list-label">
        <span>{loading ? "Consultando solicitudes..." : (soloAsignadas
          ? (administradorSeleccionado ? `Solicitudes asignadas a ${administradorSeleccionado.nombre || administradorSeleccionado.username}` : "Selecciona un administrador para consultar su bandeja")
          : "Bandeja general de solicitudes")}</span>
        {!loading && !errorCarga && (!soloAsignadas || adminSeleccionadoId) && (
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

      {!loading && !errorCarga && soloAsignadas && !adminSeleccionadoId && !errorAdministradores && (
        <div className="admin-inbox-state">
          <AppIcon name="user" size={30} />
          <strong>{loadingAdministradores ? "Cargando administradores" : (administradores.length ? "Selecciona un administrador" : "No hay administradores activos disponibles")}</strong>
          <p>{administradores.length ? "Busca tu nombre o el del trabajador que deseas consultar. Aquí aparecerán únicamente sus PQRS asignadas." : "Verifica que existan cuentas administrativas activas para consultar sus solicitudes."}</p>
        </div>
      )}

      {!loading && !errorCarga && pqrs.length === 0 && (!soloAsignadas || adminSeleccionadoId) && (
        <div className="admin-inbox-state">
          <AppIcon name="files" size={30} />
          <strong>{soloAsignadas ? `${administradorSeleccionado?.nombre || "Este administrador"} no tiene PQRS asignadas` : "No hay PQRS para mostrar"}</strong>
          <p>{soloAsignadas ? "Cuando se le asigne una solicitud, aparecerá aquí." : "Cuando se registren solicitudes, aparecerán aquí para que puedas gestionarlas."}</p>
        </div>
      )}

      {!loading && !errorCarga && pqrs.length > 0 && pqrsFiltradas.length === 0 && (
        <div className="admin-inbox-state">
          <AppIcon name="search" size={30} />
          <strong>No encontramos coincidencias</strong>
          <p>Prueba con otro texto o limpia los filtros para ver {soloAsignadas ? "las solicitudes de este administrador" : "todas las solicitudes"}.</p>
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
                    onClick={() => navigate(`/detalle-admin/${encodeURIComponent(requestId)}`, {
                      state: { adminDashboardView: soloAsignadas ? "asignadas" : "ver" },
                    })}
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
    fetch(`${API_URL}/pqrs/estadisticas-global`, {
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
