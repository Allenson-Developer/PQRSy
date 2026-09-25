import { useEffect, useState } from "react";
import "./UserDashboard.css";

function AdminDashboard() {

  //////////////////////////////////////////////////////
  // STATES
  //////////////////////////////////////////////////////

  const [vista, setVista] =
    useState("ver");

  //////////////////////////////////////////////////////
  // VALIDAR ADMIN
  //////////////////////////////////////////////////////

  useEffect(() => {

    const usuario =
      JSON.parse(
        localStorage.getItem("user")
      );

    if (
      !usuario ||
      usuario.role !== "ADMIN"
    ) {

      window.location.href = "/";
    }

  }, []);

  //////////////////////////////////////////////////////
  // LOGOUT
  //////////////////////////////////////////////////////

  const logout = () => {

    const confirmar =
      window.confirm(
        "¿Seguro que deseas cerrar sesión?"
      );

    if (confirmar) {

     localStorage.removeItem("user");
     localStorage.removeItem("token");

      window.location.href = "/";
    }
  };

  //////////////////////////////////////////////////////
  // RENDER
  //////////////////////////////////////////////////////

  return (

    <div className="user-container">

      {/* SIDEBAR */}

      <div className="sidebar">

        <h2>
          👨‍💼 ADMIN
        </h2>

        <button
          onClick={() =>
            setVista("ver")
          }
        >
          📋 Todas las PQRS
        </button>

        <button
          onClick={() =>
            setVista("stats")
          }
        >
          📊 Estadísticas
        </button>

        <button
          className="logout"
          onClick={logout}
        >
          🚪 Cerrar sesión
        </button>

      </div>

      {/* CONTENIDO */}

      <div className="content">

        {vista === "ver" && (

          <AdminPQRS />

        )}

        {vista === "stats" && (

          <AdminStats />

        )}

      </div>

    </div>
  );
}

export default AdminDashboard;

//////////////////////////////////////////////////////
// PANEL PQRS ADMIN
//////////////////////////////////////////////////////

function AdminPQRS() {

  //////////////////////////////////////////////////////
  // STATES
  //////////////////////////////////////////////////////

  const [pqrs, setPqrs] =
    useState([]);

  const [filtro, setFiltro] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [respuestas, setRespuestas] =
    useState({});

  //////////////////////////////////////////////////////
  // CARGAR PQRS
  //////////////////////////////////////////////////////

  const cargarPqrs = async () => {

    try {

      setLoading(true);

      let url = "";

      if (!filtro) {

        url =
          "http://localhost:8080/pqrs/todas";

      } else {

        url =
          `http://localhost:8080/pqrs/estado?estado=${filtro}`;
      }

      const response =
        await fetch(url);

      if (!response.ok) {

        throw new Error(
          "Error cargando PQRS"
        );
      }

      const data =
        await response.json();

      setPqrs(data || []);

    } catch (error) {

      console.error(error);

      alert(
        "Error cargando PQRS"
      );

      setPqrs([]);

    } finally {

      setLoading(false);
    }
  };

  //////////////////////////////////////////////////////
  // EFFECT
  //////////////////////////////////////////////////////

  useEffect(() => {

    cargarPqrs();

  }, [filtro]);

  //////////////////////////////////////////////////////
  // COLOR ESTADO
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
  // FORMATEAR ESTADO
  //////////////////////////////////////////////////////

  const formatearEstado = (
    estado
  ) => {

    if (!estado)
      return "Sin estado";

    switch (
      estado.toUpperCase()
    ) {

      case "PENDIENTE":
        return "Pendiente";

      case "PROCESO":
        return "En trámite";

      case "RESUELTO":
        return "Resuelto";

      case "CERRADO":
        return "Cerrado";

      default:
        return estado;
    }
  };

  //////////////////////////////////////////////////////
  // INPUT RESPUESTA
  //////////////////////////////////////////////////////

  const handleRespuestaChange = (
    id,
    valor
  ) => {

    setRespuestas((prev) => ({

      ...prev,

      [id]: valor
    }));
  };

  //////////////////////////////////////////////////////
  // VALIDAR RESPUESTA
  //////////////////////////////////////////////////////

  const puedeResponder = (
    item
  ) => {

    if (
      !item.respuestaAdmin
    ) {
      return true;
    }

    if (
      item.estado ===
      "RESUELTO"
      &&
      !item.respuestaFinalEnviada
    ) {
      return true;
    }

    return false;
  };

  //////////////////////////////////////////////////////
  // TEXTO INFO RESPUESTA
  //////////////////////////////////////////////////////

  const obtenerTextoRespuesta = (
    item
  ) => {

    if (
      !item.respuestaAdmin
    ) {

      return "Puedes enviar una respuesta oficial al usuario. Esta opción se deshabilitará después de enviar el mensaje.";
    }

    if (
      item.estado ===
      "RESUELTO"
      &&
      !item.respuestaFinalEnviada
    ) {

      return "La PQRS fue resuelta. Ahora puedes enviar el mensaje final al usuario.";
    }

    return "Ya fue enviada la respuesta correspondiente al usuario.";
  };

  //////////////////////////////////////////////////////
  // ENVIAR RESPUESTA
  //////////////////////////////////////////////////////

  const enviarRespuesta = async (
    item
  ) => {

    const mensaje =
      respuestas[item.id];

    if (
      !mensaje ||
      mensaje.trim() === ""
    ) {

      return alert(
        "Debes escribir una respuesta."
      );
    }

    try {

      const response =
        await fetch(
          `http://localhost:8080/pqrs/responder/${item.id}`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              mensaje
            })
          }
        );

      if (!response.ok) {

        throw new Error();
      }

      alert(
        "Respuesta enviada correctamente."
      );

      ////////////////////////////////////////////////////
      // LIMPIAR TEXTAREA
      ////////////////////////////////////////////////////

      setRespuestas((prev) => ({

        ...prev,

        [item.id]: ""
      }));

      cargarPqrs();

    } catch (error) {

      console.error(error);

      alert(
        "Error enviando respuesta."
      );
    }
  };

  //////////////////////////////////////////////////////
  // ABRIR ARCHIVO
  //////////////////////////////////////////////////////

  const abrirArchivo = (
    nombreArchivo
  ) => {

    window.open(
      `http://localhost:8080/pqrs/archivo/${nombreArchivo}`,
      "_blank"
    );
  };

  //////////////////////////////////////////////////////
  // RENDER
  //////////////////////////////////////////////////////

  return (

    <div className="card">

      {/* HEADER */}

      <div className="top-header">

        <div>

          <h2>
            📋 Panel Administrativo PQRS
          </h2>

          <p className="subtitulo">

            Gestión completa de solicitudes y seguimiento.

          </p>

        </div>

        {/* FILTRO */}

        <select
          value={filtro}
          onChange={(e) =>
            setFiltro(
              e.target.value
            )
          }
        >

          <option value="">
            Todas
          </option>

          <option value="PENDIENTE">
            Pendientes
          </option>

          <option value="PROCESO">
            En trámite
          </option>

          <option value="RESUELTO">
            Resueltas
          </option>

          <option value="CERRADO">
            Cerradas
          </option>

        </select>

      </div>

      {/* LOADING */}

      {loading && (

        <p>
          Cargando PQRS...
        </p>

      )}

      {/* VACÍO */}

      {!loading &&
        pqrs.length === 0 && (

          <div className="empty-box">

            <p>
              No hay PQRS registradas.
            </p>

          </div>
        )}

      {/* LISTADO */}

      {!loading &&
        pqrs.length > 0 && (

          <div className="pqrs-grid">

            {pqrs.map((item) => (

              <div
                key={item.id}
                className="admin-pqrs-card"
              >

                {/* HEADER */}

                <div className="admin-card-top">

                  <div>

                    <h2 className="admin-card-title">
                      {item.tipo}
                    </h2>

                    <p className="admin-card-user">

                      👤{" "}

                      <strong>
                        {item.nombre ||
                          "Sin nombre"}
                      </strong>

                      <span>
                        {" "}@
                        {item.username ||
                          "sin_usuario"}
                      </span>

                    </p>

                  </div>

                  <div
                    className={`admin-estado ${obtenerClaseEstado(
                      item.estado
                    )}`}
                  >
                    {formatearEstado(
                      item.estado
                    )}
                  </div>

                </div>

                {/* DESCRIPCIÓN */}

                <div className="admin-card-body">

                  <p>
                    {item.descripcion}
                  </p>

                </div>

                {/* ARCHIVO */}

                {item.archivo && (

                  <div className="archivo-admin-box">

                    <button
                      className="archivo-btn"
                      onClick={() =>
                        abrirArchivo(
                          item.archivo
                        )
                      }
                    >
                      📎 Ver archivo adjunto
                    </button>

                  </div>
                )}

                {/* RESPUESTA ADMIN */}

                <div
                  className={`respuesta-user-box ${
                    !puedeResponder(item)
                      ? "respuesta-bloqueada"
                      : ""
                  }`}
                >

                  <div className="respuesta-header">

                    <div>

                      <h3>
                        💬 RESPUESTA AL USUARIO
                      </h3>

                      <p>
                        {obtenerTextoRespuesta(
                          item
                        )}
                      </p>

                    </div>

                  </div>

                  <div className="respuesta-actions">

                    <textarea
                      placeholder="Escribe la respuesta que será enviada al usuario..."
                      value={
                        respuestas[item.id] ||
                        ""
                      }
                      disabled={
                        !puedeResponder(item)
                      }
                      onChange={(e) =>
                        handleRespuestaChange(
                          item.id,
                          e.target.value
                        )
                      }
                    />

                    <button
                      disabled={
                        !puedeResponder(item)
                      }
                      className="btn-enviar-respuesta"
                      onClick={() =>
                        enviarRespuesta(item)
                      }
                    >
                      📩 Enviar respuesta
                    </button>

                  </div>

                </div>

                {/* FOOTER */}

                <div className="admin-card-footer">

                  <div className="admin-footer-left">

                    <div className="admin-fecha">

                      🕒{" "}

                      {new Date(
                        item.fecha
                      ).toLocaleString(
                        "es-CO"
                      )}

                    </div>

                    {item.agenteAsignado && (

                      <div className="admin-agent-box">

                        <span>
                          👨‍💼 Agente asignado
                        </span>

                        <strong>
                          {item.agenteAsignado}
                        </strong>

                      </div>

                    )}

                  </div>

                  <button
                    className="admin-open-btn"
                    onClick={() => {

                      console.log(item);

                      window.location.href =
                        `/detalle-admin/${item.id || item._id}`;
                    }}
                  >
                    📌 Revisar trámite
                  </button>

                </div>

              </div>
            ))}

          </div>
        )}

    </div>
  );
}

//////////////////////////////////////////////////////
// DASHBOARD STATS
//////////////////////////////////////////////////////

function AdminStats() {

  //////////////////////////////////////////////////////
  // STATE
  //////////////////////////////////////////////////////

  const [stats, setStats] =
    useState({});

  //////////////////////////////////////////////////////
  // EFFECT
  //////////////////////////////////////////////////////

  useEffect(() => {

    fetch(
      "http://localhost:8080/pqrs/estadisticas-global"
    )
      .then((res) => {

        if (!res.ok) {

          throw new Error();
        }

        return res.json();
      })

      .then((data) => {

        setStats(data);
      })

      .catch(() => {

        alert(
          "Error cargando estadísticas"
        );

        setStats({});
      });

  }, []);

  //////////////////////////////////////////////////////
  // RENDER
  //////////////////////////////////////////////////////

  return (

    <div className="card">

      <h2>
        📊 Dashboard Global
      </h2>

      <div className="stats-grid">

        <div className="stat-card">

          <h3>
            Total
          </h3>

          <p>
            {stats.total || 0}
          </p>

        </div>

        <div className="stat-card">

          <h3>
            Pendientes
          </h3>

          <p>
            {stats.pendientes || 0}
          </p>

        </div>

        <div className="stat-card">

          <h3>
            En proceso
          </h3>

          <p>
            {stats.proceso || 0}
          </p>

        </div>

        <div className="stat-card">

          <h3>
            Resueltas
          </h3>

          <p>
            {stats.resueltas || 0}
          </p>

        </div>

      </div>

    </div>
  );
}