import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./UserDashboard.css";

function DetallePQRSAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pqrs, setPqrs] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  const [nuevoEstado, setNuevoEstado] = useState("");
  const [notaInterna, setNotaInterna] = useState("");
  const [agente, setAgente] = useState("");

  // Revisa si el usuario es ADMIN
  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("user"));
    if (!usuario || usuario.role !== "ADMIN") {
      window.location.href = "/";
    }
  }, []);

  // Obtener clase CSS según estado
  const obtenerClaseEstado = (estado) => {
    if (!estado) return "";
    const valor = estado.toLowerCase();
    if (valor.includes("pend")) return "pendiente";
    if (valor.includes("proceso")) return "proceso";
    if (valor.includes("resuelto")) return "resuelto";
    if (valor.includes("cerrado")) return "cerrado";
    return "";
  };

  // Cargar detalle y historial
  const cargarDetalle = async () => {
    const token = localStorage.getItem("token");
    try {
      setLoading(true);

      // Detalle PQRS
      const responsePqrs = await fetch(`http://localhost:8080/pqrs/detalle/${id}`, {
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (!responsePqrs.ok) throw new Error("Error cargando PQRS");
      const dataPqrs = await responsePqrs.json();
      setPqrs(dataPqrs);
      setNuevoEstado(dataPqrs.estado || "");
      setAgente(dataPqrs.agenteAsignado || "");

      // Historial
      const responseHistorial = await fetch(`http://localhost:8080/pqrs/${id}/historial-admin`, {
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (responseHistorial.ok) {
        const dataHistorial = await responseHistorial.json();
        setHistorial(Array.isArray(dataHistorial) ? dataHistorial : []);
      }
    } catch (error) {
      console.error(error);
      alert("Error cargando detalle.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDetalle();
  }, []);

  // Guardar todo: agente, estado y nota interna
  const guardarGestionCompleta = async () => {
    if (!agente.trim() && !notaInterna.trim() && !nuevoEstado) {
      return alert("Debes asignar agente, seleccionar estado o escribir una nota.");
    }

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`http://localhost:8080/pqrs/${id}/gestion-completa`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          agente,
          estado: nuevoEstado,
          comentario: notaInterna,
          responsable: "ADMIN",
        }),
      });

      if (!response.ok) throw new Error();

      alert("Gestión registrada correctamente.");
      setNotaInterna("");
      cargarDetalle();
    } catch (error) {
      console.error(error);
      alert("Error guardando gestión.");
    }
  };

  if (loading) return <div className="admin-detalle-container"><p>Cargando detalle...</p></div>;
  if (!pqrs) return <div className="admin-detalle-container"><p>PQRS no encontrada.</p></div>;

  return (
    <div className="admin-detalle-container">
      <button className="volver-btn" onClick={() => navigate("/admin")}>← Volver</button>

      {/* DETALLE PQRS */}
      <div className="detalle-card">
        <div className="detalle-header">
          <h2>{pqrs.tipo}</h2>
          <div className={`estado-soft ${obtenerClaseEstado(pqrs.estado)}`}>{pqrs.estado}</div>
        </div>
        <div className="detalle-body">
          <div className="detalle-descripcion">{pqrs.descripcion}</div>
          <div className="detalle-fecha">📅 {new Date(pqrs.fecha).toLocaleString("es-CO")}</div>
          <div className="detalle-agente">👨‍💼 Agente asignado: <strong>{pqrs.agenteAsignado || "Sin asignar"}</strong></div>
          {pqrs.archivo && (
            <div className="detalle-archivo">
              <a href={`http://localhost:8080/pqrs/archivo/${pqrs.archivo}`} target="_blank" rel="noreferrer">
                📎 Ver archivo adjunto
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ASIGNAR AGENTE */}
      <div className="respuesta-oficial-box">
        <h3>👨‍💼 Asignar agente</h3>
        <input type="text" placeholder="Nombre del agente" value={agente} onChange={(e) => setAgente(e.target.value)} />
      </div>

      {/* CAMBIO ESTADO */}
      <div className="respuesta-oficial-box">
        <h3>🔄 Cambiar estado</h3>
        <select value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value)}>
          <option value="PENDIENTE">PENDIENTE</option>
          <option value="PROCESO">PROCESO</option>
          <option value="RESUELTO">RESUELTO</option>
          <option value="CERRADO">CERRADO</option>
        </select>
      </div>

      {/* NOTAS */}
      <div className="admin-note-box">
        <h4>📝 Notas internas</h4>
        <textarea placeholder="Escribe una nota..." value={notaInterna} onChange={(e) => setNotaInterna(e.target.value)} />
      </div>

      {/* BOTON UNIFICADO */}
      <button className="guardar-gestion-btn" onClick={guardarGestionCompleta}>💾 Guardar Gestión</button>

      {/* HISTORIAL SIMPLE */}
      <div className="historial-simple">
        <h4>📜 Historial administrativo</h4>
        {historial.length === 0 ? (
          <p>No hay historial registrado.</p>
        ) : (
          historial.map((item) => (
            <div key={item.id} className="historial-simple-item">
              <div className="historial-simple-time">{new Date(item.fecha).toLocaleString("es-CO")}</div>
              <div className={`historial-simple-estado ${obtenerClaseEstado(item.estadoNuevo)}`}>{item.estadoNuevo}</div>
              <div className="historial-simple-nota">{item.comentarioInterno || item.detalle}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default DetallePQRSAdmin;