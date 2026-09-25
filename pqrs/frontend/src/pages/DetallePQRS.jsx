import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./UserDashboard.css";

function DetallePQRS() {

  //////////////////////////////////////////////////////
  // PARAMS
  //////////////////////////////////////////////////////

  const { id } = useParams();

  //////////////////////////////////////////////////////
  // STATES
  //////////////////////////////////////////////////////

  const [pqrs, setPqrs] =
    useState(null);

  const [historial, setHistorial] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  //////////////////////////////////////////////////////
  // TRADUCIR ACCIONES
  //////////////////////////////////////////////////////

  const traducirAccion = (
    accion
  ) => {

    switch (accion) {

      case "CREAR_PQRS":
        return "📨 PQRS creada";

      case "CAMBIO_ESTADO":
        return "🔄 Cambio de estado";

      case "RESPUESTA":
        return "💬 Nueva respuesta";

      case "ASIGNACION":
        return "👨‍💼 Asignación de agente";

      case "CIERRE":
        return "✅ Caso cerrado";

      case "REAPERTURA":
        return "📂 Caso reabierto";

      default:
        return accion;
    }
  };

  //////////////////////////////////////////////////////
  // CLASE ESTADO
  //////////////////////////////////////////////////////

  const obtenerClaseEstado = (
    estado
  ) => {

    if (!estado)
      return "";

    const valor =
      estado.toLowerCase();

    if (
      valor.includes("pend")
    ) {
      return "pendiente";
    }

    if (
      valor.includes("proceso") ||
      valor.includes("revision")
    ) {
      return "proceso";
    }

    if (
      valor.includes("resuelto")
    ) {
      return "resuelto";
    }

    if (
      valor.includes("cerrado")
    ) {
      return "cerrado";
    }

    return "";
  };

  //////////////////////////////////////////////////////
  // ICONOS TIMELINE
  //////////////////////////////////////////////////////

  const obtenerIcono = (
    accion
  ) => {

    switch (accion) {

      case "CREAR_PQRS":
        return "📨";

      case "CAMBIO_ESTADO":
        return "🔄";

      case "RESPUESTA":
        return "💬";

      case "ASIGNACION":
        return "👨‍💼";

      case "CIERRE":
        return "✅";

      case "REAPERTURA":
        return "📂";

      default:
        return "📌";
    }
  };

  //////////////////////////////////////////////////////
  // CARGAR DATOS
  //////////////////////////////////////////////////////

  useEffect(() => {

    if (!id) return;

    const cargarDatos =
      async () => {

        try {

          setLoading(true);

          //////////////////////////////////////////////////////
          // DETALLE PQRS
          //////////////////////////////////////////////////////

          const pqrsResponse =
            await fetch(
              `http://localhost:8080/pqrs/detalle/${id}`
            );

          if (
            !pqrsResponse.ok
          ) {

            throw new Error(
              "Error cargando PQRS"
            );
          }

          const pqrsData =
            await pqrsResponse.json();

          setPqrs(
            pqrsData
          );

          //////////////////////////////////////////////////////
          // HISTORIAL
          //////////////////////////////////////////////////////

          const historialResponse =
            await fetch(
              `http://localhost:8080/pqrs/${id}/historial`
            );

          if (
            !historialResponse.ok
          ) {

            throw new Error(
              "Error cargando historial"
            );
          }

          const historialData =
            await historialResponse.json();

          setHistorial(
            Array.isArray(
              historialData
            )
              ? historialData
              : []
          );

        } catch (error) {

          console.error(
            error
          );

          alert(
            "Error cargando información"
          );

        } finally {

          setLoading(false);
        }
      };

    cargarDatos();

  }, [id]);

  //////////////////////////////////////////////////////
  // LOADING
  //////////////////////////////////////////////////////

  if (loading) {

    return (

      <div className="detalle-container">

        <div className="detalle-card loading-card">

          <div className="loading-spinner"></div>

          <p>
            Cargando información...
          </p>

        </div>

      </div>
    );
  }

  //////////////////////////////////////////////////////
  // NO ENCONTRADO
  //////////////////////////////////////////////////////

  if (!pqrs) {

    return (

      <div className="detalle-container">

        <div className="detalle-card">

          <p>
            No se encontró la PQRS.
          </p>

        </div>

      </div>
    );
  }

  //////////////////////////////////////////////////////
  // RENDER
  //////////////////////////////////////////////////////

  return (

    <div className="detalle-container">

      {/* HERO */}

      <div className="detalle-hero">

        <div className="detalle-hero-content">

          <div className="detalle-badge">
            Caso #{pqrs.id}
          </div>

          <h1>
            {pqrs.tipo}
          </h1>

          <p>
            Seguimiento completo de tu solicitud y actualizaciones del equipo administrativo.
          </p>

        </div>

        <div
          className={`estado estado-hero ${obtenerClaseEstado(pqrs.estado)}`}
        >
          {pqrs.estado}
        </div>

      </div>

      {/* MAIN CARD */}

      <div className="detalle-card premium-card">

        <div className="detalle-grid">

          {/* LEFT */}

          <div className="detalle-main-info">

            <div className="detalle-section">

              <span className="detalle-label">
                Usuario
              </span>

              <h3 className="detalle-user-name">
                👤 {pqrs.nombre}
              </h3>

            </div>

            <div className="detalle-section">

              <span className="detalle-label">
                Descripción
              </span>

              <p className="detalle-descripcion">

                {pqrs.descripcion}

              </p>

            </div>

          </div>

          {/* RIGHT */}

          <div className="detalle-side-info">

            <div className="info-card">

              <span>
                📅 Fecha de creación
              </span>

              <strong>

                {new Date(
                  pqrs.fecha
                ).toLocaleString(
                  "es-CO"
                )}

              </strong>

            </div>

            <div className="info-card">

              <span>
                👨‍💼 Agente asignado
              </span>

              <strong>

                {pqrs.agenteAsignado ||
                  "Sin asignar"}

              </strong>

            </div>

            {pqrs.archivo && (

              <a
                className="archivo-card"
                href={`http://localhost:8080/uploads/${pqrs.archivo}`}
                target="_blank"
                rel="noreferrer"
              >

                <div>

                  <span>
                    Archivo adjunto
                  </span>

                  <strong>
                    Ver documento
                  </strong>

                </div>

                <span>
                  📎
                </span>

              </a>
            )}

          </div>

        </div>

      </div>

      {/* TIMELINE */}

      <div className="timeline-wrapper">

        <div className="timeline-header">

          <h2>
            📜 Seguimiento del caso
          </h2>

          <p>
            Historial cronológico de movimientos y respuestas.
          </p>

        </div>

        {historial.length === 0 ? (

          <div className="empty-box">

            <p>
              No hay movimientos registrados.
            </p>

          </div>

        ) : (

          <div className="timeline">

            {historial.map((h, index) => (

              <div
                key={index}
                className="timeline-item"
              >

                {/* LINE */}

                <div className="timeline-line"></div>

                {/* ICON */}

                <div className="timeline-icon">

                  {obtenerIcono(
                    h.accion
                  )}

                </div>

                {/* CONTENT */}

                <div className="timeline-content">

                  <div className="timeline-top">

                    <div>

                      <h4>

                        {traducirAccion(
                          h.accion
                        )}

                      </h4>

                      <span>

                        {h.responsable ||
                          "Sistema"}

                      </span>

                    </div>

                    <small>

                      🕒{" "}

                      {new Date(
                        h.fecha
                      ).toLocaleString(
                        "es-CO"
                      )}

                    </small>

                  </div>

                  {h.estadoNuevo && (

                    <div
                      className={`estado-mini ${obtenerClaseEstado(h.estadoNuevo)}`}
                    >
                      {h.estadoNuevo}
                    </div>
                  )}

                  {h.detalle && (

                    <div className="timeline-detail">

                      {h.detalle}

                    </div>
                  )}

                  {h.mensajeCliente && (

                    <div className="timeline-message">

                      💬 {h.mensajeCliente}

                    </div>
                  )}

                  {h.estadoAnterior &&
                    h.estadoNuevo && (

                      <div className="timeline-change">

                        <span className="estado-old">

                          {h.estadoAnterior}

                        </span>

                        <span className="timeline-arrow">

                          →

                        </span>

                        <span className="estado-new">

                          {h.estadoNuevo}

                        </span>

                      </div>
                    )}

                </div>

              </div>
            ))}

          </div>
        )}

      </div>

    </div>
  );
}

export default DetallePQRS;

