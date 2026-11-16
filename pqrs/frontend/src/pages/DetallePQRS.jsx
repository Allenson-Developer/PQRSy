import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useFeedback } from "../components/FeedbackProvider";
import "../styles/portal.css";
import "./UserDashboard.css";

const API_URL = "https://hoodvoice-api.onrender.com";

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
      GESTION_COMPLETA: "Gestión administrativa",
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
      GESTION_COMPLETA: "↻",
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
      <div className="detalle-container detalle-v2">
        <div className="detalle-v2-state" role="status">
          <div className="loading-spinner" aria-hidden="true" />
          <p>Cargando información de la solicitud...</p>
        </div>
      </div>
    );
  }

  if (!pqrs) {
    return (
      <div className="detalle-container detalle-v2">
        <button type="button" className="detalle-v2-back" onClick={handleVolver}>← Volver a Mis solicitudes</button>
        <div className="detalle-v2-error" role="alert">
          <strong>No se pudo mostrar la PQRS</strong>
          <p>{errorDetalle || "No se encontró la solicitud."}</p>
        </div>
      </div>
    );
  }

  const idVisible = pqrs.codigoPQRS || pqrs.codigoPqrs || pqrs.codigo || pqrs.numeroRadicado || pqrs.id || pqrs._id || id;
  const estado = pqrs.estado || "Sin estado";
  const fechaCreacion = formatoFecha(pqrs.fecha);

  return (
    <div className="detalle-container detalle-v2">
      <button type="button" className="detalle-v2-back" onClick={handleVolver}>
        <span aria-hidden="true">←</span> Volver a Mis solicitudes
      </button>

      <header className="detalle-v2-heading">
        <span className="detalle-v2-heading-mark" aria-hidden="true">▤</span>
        <div>
          <span className="detalle-v2-eyebrow">HOODVOICE CARTAGENA</span>
          <h1>Seguimiento de solicitud</h1>
          <p>Consulta la información y el historial de movimientos de tu PQRS.</p>
        </div>
      </header>

      {errorDetalle && (
        <div className="detalle-alerta" role="status">
          No se pudo actualizar toda la información del detalle: {errorDetalle}. Se muestran los datos disponibles.
        </div>
      )}

      <section className="detalle-v2-case-banner" aria-label="Resumen de la solicitud">
        <div className="detalle-v2-case-icon" aria-hidden="true">{obtenerIcono("CREAR_PQRS")}</div>
        <div className="detalle-v2-case-copy">
          <span>EXPEDIENTE</span>
          <h2>{idVisible ? `Caso: ${idVisible}` : "Detalle de la solicitud"}</h2>
          <p>Tipo: {pqrs.tipo || "No especificado"}</p>
        </div>
        <span className={`detalle-v2-status estado ${obtenerClaseEstado(estado)}`}>{estado}</span>
      </section>

      <div className="detalle-v2-columns">
        <section className="detalle-v2-panel detalle-v2-information">
          <div className="detalle-v2-panel-heading">
            <span className="detalle-v2-panel-icon" aria-hidden="true">ⓘ</span>
            <div>
              <h2>Información de la solicitud</h2>
              <p>Datos registrados para este caso.</p>
            </div>
          </div>

          <dl className="detalle-v2-info-list">
            <div className="detalle-v2-info-row">
              <dt><span aria-hidden="true">◇</span> Estado</dt>
              <dd><span className={`detalle-v2-inline-status estado ${obtenerClaseEstado(estado)}`}>{estado}</span></dd>
            </div>
            <div className="detalle-v2-info-row">
              <dt><span aria-hidden="true">▤</span> Tipo</dt>
              <dd>{pqrs.tipo || "No especificado"}</dd>
            </div>
            <div className="detalle-v2-info-row">
              <dt><span aria-hidden="true">♙</span> Solicitante</dt>
              <dd>{pqrs.nombre || pqrs.username || "Usuario"}</dd>
            </div>
            <div className="detalle-v2-info-row">
              <dt><span aria-hidden="true">▦</span> Fecha de creación</dt>
              <dd>{fechaCreacion}</dd>
            </div>
            <div className="detalle-v2-info-row">
              <dt><span aria-hidden="true">♧</span> Agente asignado</dt>
              <dd>{pqrs.agenteAsignado || "Sin asignar"}</dd>
            </div>
            <div className="detalle-v2-description-row">
              <dt><span aria-hidden="true">▤</span> Descripción</dt>
              <dd>{pqrs.descripcion || "Sin descripción disponible."}</dd>
            </div>
          </dl>

          {pqrs.archivo && (
            <button type="button" className="detalle-v2-attachment" onClick={() => abrirArchivo(pqrs.archivo)}>
              <span aria-hidden="true">📎</span>
              <span><strong>Documento adjunto</strong><small>{pqrs.archivo}</small></span>
              <b>Ver documento ↗</b>
            </button>
          )}
        </section>

        <section className="detalle-v2-panel detalle-v2-history">
          <div className="detalle-v2-panel-heading detalle-v2-history-heading">
            <span className="detalle-v2-panel-icon" aria-hidden="true">▱</span>
            <div>
              <h2>Historial de movimientos</h2>
              <p>Registro cronológico de las acciones y respuestas de tu solicitud.</p>
            </div>
            <span className="detalle-v2-count">{historial.length} {historial.length === 1 ? "movimiento" : "movimientos"}</span>
          </div>

          {errorHistorial && (
            <div className="detalle-alerta" role="status">
              No se pudo recuperar el historial desde el servidor: {errorHistorial}
            </div>
          )}

          {!errorHistorial && historial.length === 0 ? (
            <div className="detalle-v2-empty">
              <span aria-hidden="true">▤</span>
              <strong>Aún no hay movimientos registrados</strong>
              <p>Cuando se registren cambios de estado, respuestas o asignaciones, aparecerán aquí.</p>
            </div>
          ) : (
            <div className="detalle-v2-timeline">
              {historial.map((movimiento, index) => (
                <article
                  key={movimiento.id || movimiento._id || `${movimiento.accion || "movimiento"}-${movimiento.fecha || index}-${index}`}
                  className="detalle-v2-event"
                >
                  <div className="detalle-v2-event-marker" aria-hidden="true">{obtenerIcono(movimiento.accion)}</div>
                  <div className="detalle-v2-event-card">
                    <div className="detalle-v2-event-top">
                      <h3>{formatearAccion(movimiento.accion)}</h3>
                      <time>{formatoFecha(movimiento.fecha)}</time>
                    </div>
                    <div className="detalle-v2-event-tags">
                      {movimiento.estadoNuevo && (
                        <span className={`detalle-v2-inline-status estado ${obtenerClaseEstado(movimiento.estadoNuevo)}`}>
                          {movimiento.estadoNuevo}
                        </span>
                      )}
                      {movimiento.responsable && <span className="detalle-v2-person">♙ {movimiento.responsable}</span>}
                    </div>
                    {movimiento.tipo && <p className="detalle-v2-event-type">Tipo de solicitud: <strong>{movimiento.tipo}</strong></p>}
                    {movimiento.detalle && <p className="detalle-v2-event-message">{movimiento.detalle}</p>}
                    {movimiento.mensajeCliente && <p className="detalle-v2-event-message">💬 {movimiento.mensajeCliente}</p>}
                    {movimiento.estadoAnterior && movimiento.estadoNuevo && (
                      <div className="detalle-v2-state-change">
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
    </div>
  );
}

export default DetallePQRS;
