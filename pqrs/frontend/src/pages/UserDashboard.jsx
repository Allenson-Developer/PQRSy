import { useEffect, useState } from "react";
import DetallePQRS from "./DetallePQRS";
import "./UserDashboard.css";

function UserDashboard() {

  const [vista, setVista] = useState("crear");

  const [pqrsSeleccionada, setPqrsSeleccionada] =
    useState(null);

  useEffect(() => {

    const usuario =
      JSON.parse(localStorage.getItem("user"));

    if (!usuario) {

      window.location.href = "/";
    }

  }, []);

  const logout = () => {

    if (confirm("¿Seguro que deseas cerrar sesión?")) {

    localStorage.removeItem("user");
    localStorage.removeItem("token");

      window.location.href = "/";
    }
  };

  return (

    <div className="user-container">

      <div className="sidebar">

        <h2>PQRS</h2>

        <button onClick={() => setVista("crear")}>
          Crear PQRS
        </button>

        <button onClick={() => setVista("ver")}>
          Mis Solicitudes
        </button>

        <button onClick={() => setVista("stats")}>
          Estadísticas
        </button>

        <button onClick={() => setVista("perfil")}>
          Mi Perfil
        </button>

        <button
          className="logout"
          onClick={logout}
        >
          Cerrar sesión
        </button>

      </div>

      <div className="content">

        {vista === "crear" && <CrearPQRS />}

        {vista === "ver" && (

          <VerPQRS
            setVista={setVista}
            setPqrsSeleccionada={
              setPqrsSeleccionada
            }
          />
        )}

        {vista === "detalle" && (

          <DetallePQRS
            pqrs={pqrsSeleccionada}
            volver={() => setVista("ver")}
          />
        )}

        {vista === "perfil" && <Perfil />}

        {vista === "stats" && <Stats />}

      </div>

    </div>
  );
}

export default UserDashboard;

///////////////////////
// CREAR PQRS
///////////////////////

function CrearPQRS() {

  const [tipo, setTipo] = useState("");

  const [descripcion, setDescripcion] =
    useState("");

  const [archivo, setArchivo] =
    useState(null);

  const usuario =
    JSON.parse(localStorage.getItem("user"));

  const enviarPQRS = async () => {

    if (!usuario) {

      alert("Sesión expirada");

      window.location.href = "/";

      return;
    }

    try {

      const formData = new FormData();

      formData.append("tipo", tipo);

      formData.append(
        "descripcion",
        descripcion
      );

      formData.append(
        "usuarioId",
        usuario.id
      );

      if (archivo) {

        formData.append(
          "archivo",
          archivo
        );
      }

      const response = await fetch(
        "http://localhost:8080/pqrs",
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {

        alert(
          "PQRS enviada correctamente"
        );

        setTipo("");

        setDescripcion("");

        setArchivo(null);

      } else {

        alert("Error al enviar PQRS");
      }

    } catch {

      alert("Error de conexión");
    }
  };

  return (

    <div className="card">

      <h2>Crear PQRS</h2>

      <select
        value={tipo}
        onChange={(e) =>
          setTipo(e.target.value)
        }
      >

        <option value="">
          Selecciona tipo
        </option>

        <option value="PETICION">
          Petición
        </option>

        <option value="QUEJA">
          Queja
        </option>

        <option value="RECLAMO">
          Reclamo
        </option>

        <option value="SUGERENCIA">
          Sugerencia
        </option>

        <option value="FELICITACION">
          Felicitación
        </option>

        <option value="DENUNCIA">
          Denuncia
        </option>

      </select>

      <textarea
        placeholder="Describe tu solicitud..."
        value={descripcion}
        onChange={(e) =>
          setDescripcion(e.target.value)
        }
      />

     <div className="file-upload">

  <label className="custom-file-upload">

    <input
      type="file"
      onChange={(e) =>
        setArchivo(
          e.target.files[0]
        )
      }
    />

    <span className="upload-icon">
      📎
    </span>

    <span className="upload-text">
      Seleccionar archivo
    </span>

  </label>

  <span className="file-name">

    {archivo
      ? archivo.name
      : "Ningún archivo seleccionado"}

  </span>

</div>

<button onClick={enviarPQRS}>
  Enviar
</button>
    </div>
  );
}

///////////////////////
// VER PQRS
///////////////////////

function VerPQRS({

  setVista,

  setPqrsSeleccionada,

}) {

  const [pqrs, setPqrs] =
    useState([]);

  const [filtro, setFiltro] =
    useState("");

  const [respuestasInput,
    setRespuestasInput] =
    useState({});

  const usuario =
    JSON.parse(localStorage.getItem("user"));

  const cargarPQRS = () => {

    let url = "";

    if (!filtro || filtro === "") {

      url =
        `http://localhost:8080/pqrs/usuario/${usuario.id}`;

    } else {

      url =
        `http://localhost:8080/pqrs/usuario/${usuario.id}/estado?estado=${filtro}`;
    }

    fetch(url)
      .then((res) => {

        if (!res.ok) {

          throw new Error(
            "Error backend"
          );
        }

        return res.json();
      })

      .then((data) => {

        setPqrs(data || []);
      })

      .catch(() => {

        setPqrs([]);
      });
  };

  useEffect(() => {

    if (!usuario) {

      window.location.href = "/";

      return;
    }

    cargarPQRS();

  }, [filtro]);

  const enviarRespuesta = async (id) => {

    const mensaje =
      respuestasInput[id];

    if (!mensaje ||
      !mensaje.trim()) {

      alert("Escribe una respuesta");

      return;
    }

    try {

      const res = await fetch(
        `http://localhost:8080/pqrs/${id}/responder`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({

            respuesta: mensaje,

            autor: "USER",
          }),
        }
      );

      if (res.ok) {

        setRespuestasInput({

          ...respuestasInput,

          [id]: "",
        });

        cargarPQRS();

      } else {

        alert("Error al responder");
      }

    } catch {

      alert("Error de conexión");
    }
  };

  const eliminarPQRS = async (id) => {

    if (!confirm(
      "¿Eliminar esta solicitud?"
    )) {

      return;
    }

    try {

      const response = await fetch(
        `http://localhost:8080/pqrs/${id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {

        alert("PQRS eliminada");

        cargarPQRS();
      }

    } catch {

      alert("Error de conexión");
    }
  };

  const editarPQRS = async (item) => {

    const nuevaDescripcion =
      prompt(
        "Editar descripción",
        item.descripcion
      );

    if (!nuevaDescripcion) {

      return;
    }

    try {

      const response = await fetch(
        `http://localhost:8080/pqrs/${item.id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({

            descripcion:
              nuevaDescripcion,
          }),
        }
      );

      if (response.ok) {

        cargarPQRS();
      }

    } catch {

      alert("Error de conexión");
    }
  };

  return (

    <div className="card">

      <h2>Mis Solicitudes</h2>

      <select
        value={filtro}
        onChange={(e) =>
          setFiltro(e.target.value)
        }
      >

        <option value="">
          Todas
        </option>

        <option value="PENDIENTE">
          Pendiente
        </option>

        <option value="PROCESO">
          Proceso
        </option>

        <option value="RESUELTO">
          Resuelto
        </option>

      </select>

      {pqrs.length === 0 ? (

        <p>No tienes solicitudes</p>

      ) : (

        pqrs.map((item) => (

          <div
            key={item.id}
            className="pqrs-item"
          >

            <h4>{item.tipo}</h4>

            <p>{item.descripcion}</p>

            <small className="fecha">

              🕒{" "}

              {new Date(item.fecha)
                .toLocaleString("es-CO")}

            </small>

            <div
              style={{
                marginTop: "16px",
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >

              <button
                onClick={() => {

                  setPqrsSeleccionada(
                    item
                  );

                  setVista("detalle");
                }}
              >
                Ver seguimiento
              </button>

              <button
                className="btn-editar"
                onClick={() =>
                  editarPQRS(item)
                }
              >
                Editar
              </button>

              <button
                className="btn-cancelar"
                onClick={() =>
                  eliminarPQRS(item.id)
                }
              >
                Cancelar
              </button>

            </div>

          </div>
        ))
      )}

    </div>
  );
}

///////////////////////
// STATS
///////////////////////

function Stats() {

  const [stats, setStats] =
    useState({});

  const usuario =
    JSON.parse(localStorage.getItem("user"));

  useEffect(() => {

    fetch(
      `http://localhost:8080/pqrs/estadisticas/${usuario.id}`
    )

      .then((res) => res.json())

      .then((data) =>
        setStats(data)
      )

      .catch(() =>
        alert(
          "Error cargando estadísticas"
        )
      );

  }, []);

  return (

    <div className="card">

      <h2>Estadísticas</h2>

      <p>Total: {stats.total || 0}</p>

      <p>
        Pendientes:{" "}
        {stats.pendientes || 0}
      </p>

      <p>
        En proceso:{" "}
        {stats.proceso || 0}
      </p>

      <p>
        Resueltos:{" "}
        {stats.resueltas || 0}
      </p>

    </div>
  );
}

///////////////////////
// PERFIL
///////////////////////

function Perfil() {

  const usuario =
    JSON.parse(localStorage.getItem("user"));

  const [nombre, setNombre] =
    useState(usuario?.nombre || "");

  const [username, setUsername] =
    useState(usuario?.username || "");

  const [password, setPassword] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");

  const [error, setError] =
    useState("");

  const guardarCambios = async () => {

    setMensaje("");

    setError("");

    if (!nombre || !username) {

      setError(
        "Nombre y usuario son obligatorios"
      );

      return;
    }

    if (password &&
      password.length < 4) {

      setError(
        "La contraseña debe tener mínimo 4 caracteres"
      );

      return;
    }

    try {

      const response = await fetch(
        `http://localhost:8080/test/actualizar/${usuario.id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({

            nombre,

            username,

            password,
          }),
        }
      );

      if (response.ok) {

        const data =
          await response.json();

        localStorage.setItem(
          "user",
          JSON.stringify(data)
        );

        setMensaje(
          "Perfil actualizado correctamente"
        );

      } else {

        setError(
          "Error al actualizar"
        );
      }

    } catch {

      setError(
        "Error de conexión"
      );
    }
  };

  return (

    <div className="card">

      <h2>Mi Perfil</h2>

      {error && (
        <p className="error">
          {error}
        </p>
      )}

      {mensaje && (
        <p className="success">
          {mensaje}
        </p>
      )}

      <div className="form-group">

        <label>Nombre</label>

        <input
          value={nombre}
          onChange={(e) =>
            setNombre(e.target.value)
          }
        />

      </div>

      <div className="form-group">

        <label>Usuario</label>

        <input
          value={username}
          onChange={(e) =>
            setUsername(e.target.value)
          }
        />

      </div>

      <div className="form-group">

        <label>Contraseña</label>

        <input
          type="password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />

      </div>

      <button onClick={guardarCambios}>
        Guardar cambios
      </button>

    </div>
  );
}