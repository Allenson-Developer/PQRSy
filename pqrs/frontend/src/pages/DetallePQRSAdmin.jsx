import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useFeedback } from "../components/FeedbackProvider";
import AppIcon from "../components/AppIcon";
import "../styles/portal.css";
import "./DetallePQRSAdmin.css";

const API_URL = "http://localhost:8080";

function leerUsuarioGuardado() {
  try {
    const guardado = localStorage.getItem("user");
    return guardado ? JSON.parse(guardado) : null;
  } catch (error) {
    console.error("No se pudo leer la sesión:", error);
    return null;
  }
}

async function leerDetalleError(response) {
  try {
    const texto = await response.text();
    return texto || `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
}

function formatearFecha(fecha) {
  if (!fecha) return "Fecha no disponible";

  const valor = new Date(fecha);
  return Number.isNaN(valor.getTime())
    ? "Fecha no disponible"
    : valor.toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
}

function obtenerClaseEstado(estado) {
  if (!estado) return "";

  const valor = estado.toLowerCase();
  if (valor.includes("pend")) return "pendiente";
  if (valor.includes("proceso") || valor.includes("revision")) return "proceso";
  if (valor.includes("resuelto")) return "resuelto";
  if (valor.includes("cerrado")) return "cerrado";
  return "";
}

function formatearEstado(estado) {
  switch (String(estado || "").trim().toUpperCase()) {
    case "PENDIENTE": return "Pendiente";
    case "PROCESO": return "En trámite";
    case "RESUELTO": return "Resuelta";
    case "CERRADO": return "Cerrada";
    default: return estado || "Sin estado";
  }
}

function traducirAccion(accion) {
  const acciones = {
    CREAR_PQRS: "PQRS creada",
    CAMBIO_ESTADO: "Cambio de estado",
    RESPUESTA: "Respuesta registrada",
    ASIGNACION: "Agente asignado",
    CIERRE: "Caso cerrado",
    REAPERTURA: "Caso reabierto",
    NOTA_INTERNA: "Nota interna",
  };

  return acciones[accion] || accion || "Movimiento registrado";
}

function obtenerIconoAccion(accion) {
  const iconos = {
    CREAR_PQRS: "filePlus",
    CAMBIO_ESTADO: "refresh",
    RESPUESTA: "mail",
    ASIGNACION: "user",
    CIERRE: "checkCircle",
    REAPERTURA: "refresh",
    NOTA_INTERNA: "shield",
  };

  return iconos[accion] || "clock";
}

function AdminDetailAccordion({ id, title, description, icon, open, onToggle, badge, children }) {
  return (
    <section className={`admin-detail-accordion ${open ? "is-open" : ""}`}>
      <button
        id={`${id}-trigger`}
        className="admin-detail-accordion-trigger"
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={onToggle}
      >
        <span className="admin-detail-accordion-icon" aria-hidden="true">
          <AppIcon name={icon} size={18} />
        </span>
        <span className="admin-detail-accordion-copy">
          <span className="admin-detail-accordion-title">{title}</span>
          <span className="admin-detail-accordion-description">{description}</span>
        </span>
        {badge !== undefined && <span className="admin-detail-history-count">{badge}</span>}
        <AppIcon name="chevronDown" size={17} className="admin-detail-accordion-chevron" />
      </button>
      {open && (
        <div id={`${id}-panel`} className="admin-detail-accordion-panel" role="region" aria-labelledby={`${id}-trigger`}>
          {children}
        </div>
      )}
    </section>
  );
}

function DetallePQRSAdmin() {
  const { notify } = useFeedback();
  const { id } = useParams();
  const navigate = useNavigate();

  const [pqrs, setPqrs] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");
  const [errorHistorial, setErrorHistorial] = useState("");

  const [nuevoEstado, setNuevoEstado] = useState("");
  const [notaInterna, setNotaInterna] = useState("");
  const [agente, setAgente] = useState("");
  const [seccionAbierta, setSeccionAbierta] = useState("");
  const [mensajeCiudadano, setMensajeCiudadano] = useState("");
  const [enviandoMensaje, setEnviandoMensaje] = useState(false);

  useEffect(() => {
    const usuario = leerUsuarioGuardado();
    const token = localStorage.getItem("token");

    if (!usuario || usuario.role !== "ADMIN" || !token) {
      window.location.href = "/";
    }
  }, []);

  const alternarSeccion = (seccion) => {
    setSeccionAbierta((actual) => actual === seccion ? "" : seccion);
  };

  const cargarDetalle = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!id) {
      setErrorCarga("No se recibió el identificador de la PQRS.");
      setPqrs(null);
      setLoading(false);
      return;
    }

    if (!token) {
      setErrorCarga("Tu sesión no está disponible. Inicia sesión nuevamente.");
      setPqrs(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorCarga("");
    setErrorHistorial("");

    try {
      // Se conserva la ruta actual del detalle. Revisaremos las rutas del backend después.
      const responsePqrs = await fetch(`${API_URL}/pqrs/detalle/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!responsePqrs.ok) {
        const detalle = await leerDetalleError(responsePqrs);
        throw new Error(`No se pudo cargar la PQRS (${detalle}).`);
      }

      const dataPqrs = await responsePqrs.json();
      setPqrs(dataPqrs);
      setNuevoEstado(dataPqrs.estado || "PENDIENTE");
      setAgente(dataPqrs.agenteAsignado || "");

      // Se conserva la ruta actual del historial para revisar luego el endpoint y los permisos.
      const responseHistorial = await fetch(`${API_URL}/historial/admin/pqrs/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!responseHistorial.ok) {
        const detalle = await leerDetalleError(responseHistorial);
        setHistorial([]);
        setErrorHistorial(`No se pudo cargar el historial (${detalle}).`);
      } else {
        const dataHistorial = await responseHistorial.json();
        setHistorial(Array.isArray(dataHistorial) ? dataHistorial : []);
      }
    } catch (error) {
      console.error("Error cargando el detalle administrativo:", error);
      setErrorCarga(error.message || "Ocurrió un error al cargar el detalle.");
      setPqrs(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    cargarDetalle();
  }, [cargarDetalle]);

  const guardarGestionCompleta = async () => {
    if (!pqrs) return;

    const agenteOriginal = (pqrs.agenteAsignado || "").trim();
    const agenteNuevo = agente.trim();
    const estadoOriginal = pqrs.estado || "";

    if (
      !notaInterna.trim() &&
      agenteNuevo === agenteOriginal &&
      nuevoEstado === estadoOriginal
    ) {
      notify("No hay cambios para guardar. Modifica el agente, el estado o agrega una nota interna.", { title: "No hay cambios", tone: "warning" });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      notify("Tu sesión ha expirado. Inicia sesión nuevamente.", { title: "Sesión no disponible", tone: "error" });
      window.location.href = "/";
      return;
    }

    setGuardando(true);

    try {
      // Se conserva el endpoint actual de gestión.
      const response = await fetch(`${API_URL}/pqrs/${id}/gestion-completa`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          agente: agenteNuevo,
          estado: nuevoEstado,
          comentario: notaInterna.trim(),
          responsable: leerUsuarioGuardado()?.username || "ADMIN",
        }),
      });

      if (!response.ok) {
        const detalle = await leerDetalleError(response);
        throw new Error(`No se pudo guardar la gestión (${detalle}).`);
      }

      notify("La gestión se registró correctamente.", { title: "Gestión guardada", tone: "success" });
      setNotaInterna("");
      await cargarDetalle();
    } catch (error) {
      console.error("Error guardando la gestión:", error);
      notify(error.message || "Error guardando la gestión.", { title: "No se pudo guardar la gestión", tone: "error" });
    } finally {
      setGuardando(false);
    }
  };

  const enviarMensajeCiudadano = async () => {
    if (!pqrs) return;

    const mensaje = mensajeCiudadano.trim();
    if (!mensaje) {
      notify("Escribe un mensaje antes de enviarlo.", { title: "Mensaje requerido", tone: "warning" });
      return;
    }

    const estadoActual = String(pqrs.estado || "").trim().toUpperCase();
    const estadoSeleccionado = String(nuevoEstado || "").trim().toUpperCase();
    const cambioEstadoPendiente = estadoSeleccionado !== estadoActual;
    const esRespuestaFinal = Boolean(pqrs.respuestaAdmin) && estadoActual === "RESUELTO" && !pqrs.respuestaFinalEnviada;
    const puedeEnviar = !pqrs.respuestaAdmin || esRespuestaFinal;

    if (cambioEstadoPendiente) {
      notify("Guarda primero el cambio de estado. Después podrás enviar la comunicación correspondiente a esa etapa.", {
        title: "Guarda la gestión primero",
        tone: "warning",
      });
      return;
    }

    if (!puedeEnviar) {
      notify("La comunicación inicial ya fue enviada. Para enviar la respuesta final, cambia el estado a Resuelto y guarda la gestión.", {
        title: "Comunicación ya registrada",
        tone: "warning",
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      notify("Tu sesión ha expirado. Inicia sesión nuevamente.", { title: "Sesión no disponible", tone: "error" });
      window.location.href = "/";
      return;
    }

    setEnviandoMensaje(true);
    try {
      const response = await fetch(`${API_URL}/pqrs/responder/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mensaje }),
      });

      if (!response.ok) {
        const detalle = await leerDetalleError(response);
        throw new Error(`No se pudo enviar el mensaje (${detalle}).`);
      }

      setMensajeCiudadano("");
      await notify(
        esRespuestaFinal ? "La respuesta final se envió correctamente." : "La comunicación se envió correctamente.",
        { title: esRespuestaFinal ? "Respuesta final enviada" : "Mensaje enviado", tone: "success" }
      );
      await cargarDetalle();
    } catch (error) {
      console.error("Error enviando la comunicación al ciudadano:", error);
      notify(error.message || "No fue posible enviar el mensaje.", { title: "No se pudo enviar", tone: "error" });
    } finally {
      setEnviandoMensaje(false);
    }
  };

  if (loading) {
    return (
      <main className="admin-detalle-container admin-detail-page">
        <div className="admin-detail-state" role="status">
          <span className="admin-detail-spinner" aria-hidden="true" />
          <h2>Cargando expediente</h2>
          <p>Estamos recuperando la información de la solicitud.</p>
        </div>
      </main>
    );
  }

  if (!pqrs) {
    return (
      <main className="admin-detalle-container admin-detail-page">
        <button className="admin-detail-back-btn" type="button" onClick={() => navigate("/admin")}>
          <AppIcon name="arrowLeft" size={16} /> Volver al panel
        </button>
        <section className="admin-detail-state admin-detail-state-error" role="alert">
          <span className="admin-detail-state-icon" aria-hidden="true">!</span>
          <h2>No se pudo abrir la solicitud</h2>
          <p>{errorCarga || "No se encontró la PQRS solicitada."}</p>
          <div className="admin-detail-state-actions">
            <button type="button" className="admin-detail-secondary-btn" onClick={cargarDetalle}>
              Reintentar
            </button>
            <button type="button" className="admin-detail-primary-btn" onClick={() => navigate("/admin")}>
              Volver al panel
            </button>
          </div>
        </section>
      </main>
    );
  }

  const idVisible = pqrs.id || pqrs._id || id;
  const estadoClase = obtenerClaseEstado(pqrs.estado);

  return (
    <main className="admin-detalle-container admin-detail-page">
      <header className="admin-detail-topbar">
        <button className="admin-detail-back-btn" type="button" onClick={() => navigate("/admin")}>
          <AppIcon name="arrowLeft" size={16} /> Volver a todas las PQRS
        </button>
      </header>

      <section className="admin-detail-hero">
        <div className="admin-detail-hero-copy">
          <span className="admin-detail-eyebrow">GESTIÓN Y SEGUIMIENTO</span>
          <div className="admin-detail-title-row">
            <div>
              <p className="admin-detail-case-id">EXPEDIENTE #{idVisible}</p>
              <h1>{pqrs.tipo || "Solicitud PQRS"}</h1>
            </div>
            <span className={`admin-detail-status ${estadoClase}`}>
              <span className="admin-detail-status-dot" aria-hidden="true" />
              {formatearEstado(pqrs.estado)}
            </span>
          </div>
          <p className="admin-detail-hero-text">
            Revisa la solicitud y registra las acciones necesarias para continuar el trámite.
          </p>
        </div>
      </section>

      <div className="admin-detail-grid">
        <section className="admin-detail-panel">
          <div className="admin-detail-panel-heading">
            <span className="admin-detail-section-icon" aria-hidden="true"><AppIcon name="fileText" size={20} /></span>
            <div>
              <h2>Información de la solicitud</h2>
              <p>Datos registrados por el usuario.</p>
            </div>
          </div>

          <div className="admin-detail-info-list">
            <div className="admin-detail-info-row">
              <span>Solicitante</span>
              <strong>{pqrs.nombre || pqrs.username || "No disponible"}</strong>
            </div>
            {pqrs.username && (
              <div className="admin-detail-info-row">
                <span>Usuario</span>
                <strong>@{pqrs.username}</strong>
              </div>
            )}
            <div className="admin-detail-info-row">
              <span>Fecha de creación</span>
              <strong>{formatearFecha(pqrs.fecha)}</strong>
            </div>
            <div className="admin-detail-info-row">
              <span>Agente asignado</span>
              <strong>{pqrs.agenteAsignado || "Sin asignar"}</strong>
            </div>
          </div>

          <div className="admin-detail-description-block">
            <span className="admin-detail-field-caption">DESCRIPCIÓN DEL CASO</span>
            <p>{pqrs.descripcion || "La solicitud no tiene descripción."}</p>
          </div>

          {pqrs.archivo && (
            <div className="admin-detail-attachment">
              <div className="admin-detail-attachment-icon" aria-hidden="true"><AppIcon name="paperclip" size={19} /></div>
              <div className="admin-detail-attachment-copy">
                <strong>Documento adjunto</strong>
                <span>{pqrs.archivo}</span>
              </div>
              <a
                href={`${API_URL}/pqrs/archivo/${encodeURIComponent(pqrs.archivo)}`}
                className="admin-detail-attachment-link"
                target="_blank"
                rel="noreferrer"
              >
                Abrir archivo ↗
              </a>
            </div>
          )}
        </section>

        <section className="admin-detail-panel admin-detail-management">
          <div className="admin-detail-panel-heading">
            <span className="admin-detail-section-icon" aria-hidden="true"><AppIcon name="shield" size={20} /></span>
            <div>
              <h2>Gestión administrativa</h2>
              <p>Abre el apartado que necesitas para gestionar este caso.</p>
            </div>
          </div>

          <div className="admin-detail-form">
            <div className="admin-detail-accordion-list">
              <AdminDetailAccordion
                id="responsable"
                title="Responsable asignado"
                description="Persona encargada de continuar el caso."
                icon="user"
                open={seccionAbierta === "responsable"}
                onToggle={() => alternarSeccion("responsable")}
              >
                <label className="admin-detail-field">
                  <span>Agente responsable</span>
                  <input
                    type="text"
                    value={agente}
                    onChange={(event) => setAgente(event.target.value)}
                    placeholder="Nombre o usuario del administrador"
                    autoComplete="off"
                  />
                </label>
                <p className="admin-detail-accordion-hint">
                  <AppIcon name="info" size={15} />
                  Al guardar la gestión, el cambio de responsable quedará registrado en el historial.
                </p>
              </AdminDetailAccordion>

              <AdminDetailAccordion
                id="estado"
                title="Estado de la solicitud"
                description="Actualiza la etapa del trámite."
                icon="refresh"
                open={seccionAbierta === "estado"}
                onToggle={() => alternarSeccion("estado")}
              >
                <label className="admin-detail-field">
                  <span>Estado actual de la solicitud</span>
                  <select value={nuevoEstado} onChange={(event) => setNuevoEstado(event.target.value)}>
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="PROCESO">En trámite</option>
                    <option value="RESUELTO">Resuelto</option>
                    <option value="CERRADO">Cerrado</option>
                  </select>
                </label>
                <p className="admin-detail-accordion-hint">
                  <AppIcon name="info" size={15} />
                  Guarda la gestión para confirmar el cambio y registrarlo en el historial.
                </p>
              </AdminDetailAccordion>

              <AdminDetailAccordion
                id="comunicacion"
                title={pqrs.respuestaAdmin && String(pqrs.estado || "").trim().toUpperCase() === "RESUELTO" && !pqrs.respuestaFinalEnviada ? "Respuesta final al ciudadano" : "Comunicación al ciudadano"}
                description="Envía una comunicación vinculada al trámite."
                icon="mail"
                open={seccionAbierta === "comunicacion"}
                onToggle={() => alternarSeccion("comunicacion")}
              >
                {(() => {
                  const estadoGuardado = String(pqrs.estado || "").trim().toUpperCase();
                  const estadoSeleccionado = String(nuevoEstado || "").trim().toUpperCase();
                  const resuelto = estadoGuardado === "RESUELTO";
                  const esRespuestaFinal = Boolean(pqrs.respuestaAdmin) && resuelto && !pqrs.respuestaFinalEnviada;
                  const cambioEstadoPendiente = estadoSeleccionado !== estadoGuardado;
                  const puedeEnviar = !cambioEstadoPendiente && (!pqrs.respuestaAdmin || esRespuestaFinal);
                  const ayuda = cambioEstadoPendiente
                    ? "Guarda primero el cambio de estado. Después podrás enviar la comunicación correspondiente a esa etapa."
                    : puedeEnviar
                      ? (esRespuestaFinal
                        ? "La solicitud está resuelta. Este mensaje se registrará como respuesta final."
                        : "Esta comunicación se enviará al ciudadano y quedará registrada en el historial.")
                      : (resuelto
                        ? "La respuesta final ya fue enviada."
                        : "La comunicación inicial ya fue enviada. Para enviar la respuesta final, cambia el estado a Resuelto y guarda la gestión.");

                  return (
                    <>
                      <label className="admin-detail-field">
                        <span>{resuelto ? "Respuesta para el ciudadano" : "Mensaje para el ciudadano"}</span>
                        <textarea
                          value={mensajeCiudadano}
                          onChange={(event) => setMensajeCiudadano(event.target.value)}
                          placeholder={esRespuestaFinal ? "Redacta la respuesta final de la PQRS..." : "Informa al ciudadano sobre la recepción o avance de su solicitud..."}
                          rows={4}
                          maxLength={4000}
                          disabled={!puedeEnviar || enviandoMensaje}
                        />
                        <small>{mensajeCiudadano.length}/4000 caracteres</small>
                      </label>
                      <p className={`admin-detail-message-disabled ${puedeEnviar ? "is-available" : ""}`}>
                        {ayuda}
                      </p>
                      <div className="admin-detail-message-actions">
                        <button
                          className="admin-detail-message-btn"
                          type="button"
                          onClick={enviarMensajeCiudadano}
                          disabled={!puedeEnviar || enviandoMensaje}
                        >
                          <AppIcon name="send" size={16} />
                          {enviandoMensaje ? "Enviando..." : (esRespuestaFinal ? "Enviar respuesta final" : "Enviar mensaje")}
                        </button>
                      </div>
                    </>
                  );
                })()}
              </AdminDetailAccordion>

              <AdminDetailAccordion
                id="notas-internas"
                title="Notas internas"
                description="Contexto privado para otros administradores."
                icon="shield"
                open={seccionAbierta === "notas-internas"}
                onToggle={() => alternarSeccion("notas-internas")}
              >
                <label className="admin-detail-field">
                  <span>Observación interna <em>· Solo administración</em></span>
                  <textarea
                    value={notaInterna}
                    onChange={(event) => setNotaInterna(event.target.value)}
                    placeholder="Deja contexto útil para la persona que continúe la gestión..."
                    rows={4}
                    maxLength={4000}
                  />
                  <small>La nota se guardará con la gestión y no se mostrará en el seguimiento del ciudadano.</small>
                </label>
              </AdminDetailAccordion>

              <AdminDetailAccordion
                id="historial"
                title="Historial del trámite"
                description="Consulta las acciones registradas sobre esta PQRS."
                icon="clock"
                badge={`${historial.length}`}
                open={seccionAbierta === "historial"}
                onToggle={() => alternarSeccion("historial")}
              >
                <div className="admin-detail-history-inline">
                  {errorHistorial && (
                    <div className="admin-detail-inline-error" role="status">
                      <strong>No se pudo recuperar el historial.</strong>
                      <span>{errorHistorial}</span>
                    </div>
                  )}

                  {!errorHistorial && historial.length === 0 ? (
                    <div className="admin-detail-history-empty">
                      <span aria-hidden="true">◷</span>
                      <strong>Aún no hay movimientos para mostrar</strong>
                      <p>Cuando se registren acciones sobre esta PQRS, aparecerán aquí.</p>
                    </div>
                  ) : (
                    !errorHistorial && (
                      <div className="admin-detail-history-list">
                        {historial.map((item, index) => (
                          <article className="admin-detail-history-item" key={item.id || item._id || `${item.fecha}-${index}`}>
                            <div className="admin-detail-history-marker" aria-hidden="true">
                              <AppIcon name={obtenerIconoAccion(item.accion)} size={16} />
                            </div>
                            <div className="admin-detail-history-content">
                              <div className="admin-detail-history-item-top">
                                <div>
                                  <h3>{traducirAccion(item.accion)}</h3>
                                  <span>{item.responsable || "Sistema"}</span>
                                </div>
                                <time>{formatearFecha(item.fecha)}</time>
                              </div>

                              {item.estadoNuevo && (
                                <span className={`admin-detail-status admin-detail-history-status ${obtenerClaseEstado(item.estadoNuevo)}`}>
                                  {formatearEstado(item.estadoNuevo)}
                                </span>
                              )}

                              {(item.mensajeCliente || item.comentarioInterno || item.detalle) && (
                                <p className="admin-detail-history-note">
                                  {item.accion === "RESPUESTA"
                                    ? (item.mensajeCliente || item.detalle || item.comentarioInterno)
                                    : (item.comentarioInterno || item.detalle || item.mensajeCliente)}
                                </p>
                              )}

                              {item.estadoAnterior && item.estadoNuevo && (
                                <div className="admin-detail-history-change">
                                  <span>{formatearEstado(item.estadoAnterior)}</span>
                                  <span aria-hidden="true">→</span>
                                  <strong>{item.estadoNuevo}</strong>
                                </div>
                              )}
                            </div>
                          </article>
                        ))}
                      </div>
                    )
                  )}
                  {errorHistorial && (
                    <button type="button" className="admin-detail-secondary-btn" onClick={cargarDetalle}>
                      Volver a intentar
                    </button>
                  )}
                </div>
              </AdminDetailAccordion>
            </div>

            <div className="admin-detail-form-footer">
              <p>Los cambios de responsable, estado y las notas internas se guardarán juntos.</p>
              <button
                className="admin-detail-save-btn"
                type="button"
                onClick={guardarGestionCompleta}
                disabled={guardando}
              >
                {guardando ? "Guardando gestión..." : "Guardar gestión"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default DetallePQRSAdmin;
