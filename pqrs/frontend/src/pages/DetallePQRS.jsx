import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useFeedback } from "../components/FeedbackProvider";
import AppIcon from "../components/AppIcon";
import "../styles/portal.css";
import "./UserDashboard.css";

const API_URL = "http://localhost:8080";

function obtenerMensajeError(response, detalle) {
  return detalle || `HTTP ${response.status} ${response.statusText}`;
}

async function leerErrorRespuesta(response) {
  try {
    return obtenerMensajeError(response, await response.text());
  } catch {
    return obtenerMensajeError(response, "");
  }
}

function obtenerToken() {
  return localStorage.getItem("token");
}

function formatoFecha(fecha) {
  if (!fecha) return "Fecha no disponible";
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return "Fecha no disponible";
  return valor.toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function DetallePQRS({ pqrs: pqrsInicial = null, volver }) {
  const { notify } = useFeedback();
  const { id: idRuta } = useParams();
  const navigate = useNavigate();

  // El detalle se abre desde el dashboard usando props, pero también
  // admite la navegación directa a una ruta que incluya el ID.
  const id = idRuta || pqrsInicial?.id || pqrsInicial?._id || "";

  const [pqrs, setPqrs] = useState(pqrsInicial);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorDetalle, setErrorDetalle] = useState("");
  const [errorHistorial, setErrorHistorial] = useState("");

  const handleVolver = () => {
    if (typeof volver === "function") {
      volver();
      return;
    }
    navigate(-1);
  };

  const obtenerClaseEstado = (estado) => {
    const valor = String(estado || "").toLowerCase();
    if (valor.includes("pend")) return "pendiente";
    if (valor.includes("proceso") || valor.includes("revision") || valor.includes("trámite") || valor.includes("tramite")) return "proceso";
    if (valor.includes("resuelto")) return "resuelto";
    if (valor.includes("cerrado") || valor.includes("cancelado")) return "cerrado";
    return "";
  };

  const formatearAccion = (accion) => {
    const acciones = {
      CREAR_PQRS: "PQRS creada",
      CAMBIO_ESTADO: "Cambio de estado",
      RESPUESTA: "Nueva respuesta",
      ASIGNACION: "Asignación de agente",
      CIERRE: "Caso cerrado",
      REAPERTURA: "Caso reabierto",
    };
    return acciones[accion] || String(accion || "Actualización").replaceAll("_", " ");
  };

  const obtenerIcono = (accion) => {
    const iconos = {
      CREAR_PQRS: "✉️",
      CAMBIO_ESTADO: "↻",
      RESPUESTA: "💬",
      ASIGNACION: "👤",
      CIERRE: "✓",
      REAPERTURA: "↗",
    };
    return iconos[accion] || "•";
  };

  useEffect(() => {
    let activo = true;

    const cargarDatos = async () => {
      setLoading(true);
      setErrorDetalle("");
      setErrorHistorial("");

      if (!id) {
        setErrorDetalle("No se pudo identificar esta PQRS. Vuelve a Mis Solicitudes y selecciónala nuevamente.");
        setLoading(false);
        return;
      }

      const token = obtenerToken();
      if (!token) {
        setErrorDetalle("No se encontró el token de sesión. Inicia sesión nuevamente.");
        setLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      const idSeguro = encodeURIComponent(String(id));

      // Cargar el detalle y el historial por separado: si el historial no
      // está disponible, el usuario aún puede consultar los datos de la PQRS.
      try {
        const respuestaDetalle = await fetch(`${API_URL}/pqrs/detalle/${idSeguro}`, { headers });
        if (!respuestaDetalle.ok) {
          throw new Error(await leerErrorRespuesta(respuestaDetalle));
        }

        const datosDetalle = await respuestaDetalle.json();
        if (activo) setPqrs(datosDetalle);
      } catch (error) {
        console.error("Error cargando el detalle de la PQRS:", error);
        if (activo) {
          if (!pqrsInicial) setPqrs(null);
          setErrorDetalle(error.message || "No se pudo cargar el detalle de la PQRS.");
        }
      }

      try {
        const respuestaHistorial = await fetch(`${API_URL}/historial/cliente/pqrs/${idSeguro}`, { headers });
        if (!respuestaHistorial.ok) {
          throw new Error(await leerErrorRespuesta(respuestaHistorial));
        }

        const datosHistorial = await respuestaHistorial.json();
        if (activo) setHistorial(Array.isArray(datosHistorial) ? datosHistorial : []);
      } catch (error) {
        console.error("Error cargando el historial de la PQRS:", error);
        if (activo) {
          setHistorial([]);
          setErrorHistorial(error.message || "No se pudo cargar el historial de esta PQRS.");
        }
      } finally {
        if (activo) setLoading(false);
      }
    };

    cargarDatos();
    return () => {
      activo = false;
    };
    // pqrsInicial sirve como respaldo cuando se abre desde el estado del dashboard.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const abrirArchivo = async (nombreArchivo) => {
    const token = obtenerToken();
    if (!token) {
      notify("Tu sesión ha expirado. Inicia sesión nuevamente.", { title: "Sesión no disponible", tone: "error" });
      return;
    }

    // Abrir la pestaña durante el clic del usuario evita bloqueos del navegador.
    const ventana = window.open("about:blank", "_blank");
    if (!ventana) {
      notify("Permite las ventanas emergentes para abrir el archivo adjunto.", { title: "No se pudo abrir el documento", tone: "warning" });
      return;
    }

    try {
      const respuesta = await fetch(`${API_URL}/pqrs/archivo/${encodeURIComponent(nombreArchivo)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!respuesta.ok) {
        throw new Error(await leerErrorRespuesta(respuesta));
      }

      const blob = await respuesta.blob();
      const urlTemporal = URL.createObjectURL(blob);
      ventana.location.href = urlTemporal;
      window.setTimeout(() => URL.revokeObjectURL(urlTemporal), 60000);
    } catch (error) {
      ventana.close();
      console.error("Error abriendo el archivo adjunto:", error);
      notify(`No se pudo abrir el archivo adjunto. ${error.message || ""}`, { title: "Error al abrir el documento", tone: "error" });
    }
  };

  if (loading) {
    return (
      <div className="detalle-container">
        <div className="detalle-card loading-card">
          <div className="loading-spinner" aria-hidden="true" />
          <p>Cargando información de la solicitud...</p>
        </div>
      </div>
    );
  }

  if (!pqrs) {
    return (
      <div className="detalle-container">
        <button type="button" className="volver-btn" onClick={handleVolver}>← Volver a Mis Solicitudes</button>
        <div className="detalle-card detalle-error-card" role="alert">
          <h2>No se pudo mostrar la PQRS</h2>
          <p>{errorDetalle || "No se encontró la solicitud."}</p>
        </div>
      </div>
    );
  }

  const idVisible = pqrs.id || pqrs._id || id;
  const estado = pqrs.estado || "Sin estado";

  return (
    <div className="detalle-container">
      <button type="button" className="volver-btn" onClick={handleVolver}>← Volver a Mis Solicitudes</button>

      {errorDetalle && (
        <div className="detalle-alerta" role="status">
          No se pudo actualizar toda la información del detalle: {errorDetalle}. Se muestran los datos disponibles.
        </div>
      )}

      <section className="detalle-hero">
        <div className="detalle-hero-content">
          <span className="detalle-badge">Caso #{idVisible}</span>
          <h1>{pqrs.tipo || "Solicitud PQRS"}</h1>
          <p>Consulta el estado y los movimientos registrados de tu solicitud.</p>
        </div>
        <span className={`detalle-estado estado ${obtenerClaseEstado(estado)}`}>
          {estado}
        </span>
      </section>

      <section className="detalle-card premium-card">
        <div className="detalle-grid">
          <div className="detalle-main-info">
            <div className="detalle-section">
              <span className="detalle-label">Solicitante</span>
              <h3 className="detalle-user-name">👤 {pqrs.nombre || "Usuario"}</h3>
            </div>
            <div className="detalle-section">
              <span className="detalle-label">Descripción</span>
              <p className="detalle-descripcion">{pqrs.descripcion || "Sin descripción disponible."}</p>
            </div>
          </div>

          <aside className="detalle-side-info">
            <div className="info-card">
              <span>📅 Fecha de creación</span>
              <strong>{formatoFecha(pqrs.fecha)}</strong>
            </div>
            <div className="info-card">
              <span>👨‍💼 Agente asignado</span>
              <strong>{pqrs.agenteAsignado || "Sin asignar"}</strong>
            </div>
            {pqrs.archivo && (
              <button type="button" className="archivo-card" onClick={() => abrirArchivo(pqrs.archivo)}>
                <span>📎 Archivo adjunto</span>
                <strong>Ver documento ↗</strong>
              </button>
            )}
          </aside>
        </div>
      </section>

      <section className="timeline-wrapper">
        <div className="timeline-header">
          <div>
            <span className="detalle-kicker">ACTIVIDAD DEL CASO</span>
            <h2>Seguimiento de la solicitud</h2>
            <p>Historial cronológico de movimientos y respuestas registrados.</p>
          </div>
          <span className="timeline-count">{historial.length} {historial.length === 1 ? "movimiento" : "movimientos"}</span>
        </div>

        {errorHistorial && (
          <div className="detalle-alerta" role="status">
            No se pudo recuperar el historial desde el servidor: {errorHistorial}
          </div>
        )}

        {!errorHistorial && historial.length === 0 ? (
          <div className="empty-box detalle-empty">
            <span className="detalle-empty-icon">📋</span>
            <h3>Aún no hay movimientos registrados</h3>
            <p>Cuando se registren cambios de estado, respuestas o asignaciones, aparecerán aquí.</p>
          </div>
        ) : (
          <div className="timeline">
            {historial.map((movimiento, index) => (
              <article
                key={movimiento.id || movimiento._id || `${movimiento.accion || "movimiento"}-${movimiento.fecha || index}-${index}`}
                className="timeline-item"
              >
                <div className="timeline-marker" aria-hidden="true">{obtenerIcono(movimiento.accion)}</div>
                <div className="timeline-content">
                  <div className="timeline-top">
                    <div>
                      <h3>{formatearAccion(movimiento.accion)}</h3>
                      <span className="timeline-responsable">{movimiento.responsable || "Sistema"}</span>
                    </div>
                    <time>{formatoFecha(movimiento.fecha)}</time>
                  </div>

                  {movimiento.estadoNuevo && (
                    <span className={`estado-mini ${obtenerClaseEstado(movimiento.estadoNuevo)}`}>
                      {movimiento.estadoNuevo}
                    </span>
                  )}

                  {movimiento.detalle && <p className="timeline-detail">{movimiento.detalle}</p>}
                  {movimiento.mensajeCliente && <p className="timeline-message">💬 {movimiento.mensajeCliente}</p>}

                  {movimiento.estadoAnterior && movimiento.estadoNuevo && (
                    <div className="timeline-change">
                      <span className={`estado-mini ${obtenerClaseEstado(movimiento.estadoAnterior)}`}>{movimiento.estadoAnterior}</span>
                      <span aria-hidden="true">→</span>
                      <span className={`estado-mini ${obtenerClaseEstado(movimiento.estadoNuevo)}`}>{movimiento.estadoNuevo}</span>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default DetallePQRS;
