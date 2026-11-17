import { useCallback, useEffect, useRef, useState } from "react";
import "./ConversacionPQRS.css";

const API_URL = "https://hoodvoice-api.onrender.com";
const MAX_CARACTERES = 4000;

function obtenerToken() {
  return localStorage.getItem("token");
}

async function leerError(response) {
  try {
    const texto = await response.text();
    return texto || `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
}

function fechaMensaje(fecha) {
  if (!fecha) return "Fecha no disponible";
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return "Fecha no disponible";
  return valor.toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ConversacionPQRS({ pqrsId, rol = "USER" }) {
  const esAdmin = String(rol).toUpperCase() === "ADMIN";
  const [abierta, setAbierta] = useState(esAdmin);
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const listaRef = useRef(null);

  const cargarMensajes = useCallback(async (silencioso = false) => {
    const token = obtenerToken();
    if (!token || !pqrsId) return;

    if (!silencioso) {
      setCargando(true);
      setError("");
    }

    try {
      const response = await fetch(
        `${API_URL}/pqrs/${encodeURIComponent(pqrsId)}/conversacion`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) {
        throw new Error(await leerError(response));
      }
      const data = await response.json();
      setMensajes(Array.isArray(data) ? data : []);
      if (!silencioso) setError("");
    } catch (err) {
      console.error("Error cargando la conversación de la PQRS:", err);
      if (!silencioso) setError(err.message || "No se pudo cargar la conversación.");
    } finally {
      if (!silencioso) setCargando(false);
    }
  }, [pqrsId]);

  useEffect(() => {
    if (!abierta || !pqrsId) return undefined;

    cargarMensajes(false);
    const intervalo = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        cargarMensajes(true);
      }
    }, 8000);

    return () => window.clearInterval(intervalo);
  }, [abierta, pqrsId, cargarMensajes]);

  useEffect(() => {
    const lista = listaRef.current;
    if (!abierta || !lista) return;

    const estaCercaDelFinal =
      lista.scrollHeight - lista.scrollTop - lista.clientHeight < 140;
    if (estaCercaDelFinal || lista.scrollTop === 0) {
      lista.scrollTop = lista.scrollHeight;
    }
  }, [mensajes, abierta, cargando]);

  const enviarMensaje = async (event) => {
    event.preventDefault();
    const mensaje = texto.trim();
    if (!mensaje || enviando || !pqrsId) return;

    const token = obtenerToken();
    if (!token) {
      setError("Tu sesión no está disponible. Inicia sesión nuevamente.");
      return;
    }

    setEnviando(true);
    setError("");
    try {
      const response = await fetch(
        `${API_URL}/pqrs/${encodeURIComponent(pqrsId)}/conversacion`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ mensaje }),
        }
      );

      if (!response.ok) {
        throw new Error(await leerError(response));
      }

      const data = await response.json();
      if (Array.isArray(data)) setMensajes(data);
      setTexto("");
      // Confirma la lista guardada en el servidor después del envío.
      await cargarMensajes(true);
    } catch (err) {
      console.error("Error enviando mensaje de conversación:", err);
      setError(err.message || "No se pudo enviar el mensaje.");
    } finally {
      setEnviando(false);
    }
  };

  const mensajesOrdenados = [...mensajes].sort((a, b) => {
    const fechaA = new Date(a.fecha || 0).getTime();
    const fechaB = new Date(b.fecha || 0).getTime();
    return (Number.isNaN(fechaA) ? 0 : fechaA) - (Number.isNaN(fechaB) ? 0 : fechaB);
  });

  return (
    <section className={`hv-conversation hv-conversation-${esAdmin ? "admin" : "user"}`}>
      {!esAdmin && (
        <div className="hv-conversation-callout">
          <div className="hv-conversation-callout-copy">
            <span className="hv-conversation-callout-icon" aria-hidden="true">?</span>
            <div>
              <strong>¿Tienes alguna pregunta sobre esta solicitud?</strong>
              <p>Comunícate directamente con el administrador encargado.</p>
            </div>
          </div>
          <button
            type="button"
            className="hv-conversation-open-btn"
            onClick={() => setAbierta((actual) => !actual)}
            aria-expanded={abierta}
          >
            <span aria-hidden="true">▤</span>
            {abierta ? "Ocultar conversación" : "Hablar con el administrador"}
          </button>
        </div>
      )}

      {esAdmin && (
        <div className="hv-conversation-admin-bar">
          <div>
            <strong>Conversación con el ciudadano</strong>
            <span>Mensajes privados vinculados a esta PQRS.</span>
          </div>
          <button
            type="button"
            className="hv-conversation-minimize-btn"
            onClick={() => setAbierta((actual) => !actual)}
            aria-expanded={abierta}
          >
            {abierta ? "Minimizar" : "Abrir conversación"}
            <span aria-hidden="true">{abierta ? "⌃" : "⌄"}</span>
          </button>
        </div>
      )}

      {abierta && (
        <div className="hv-conversation-window">
          <header className="hv-conversation-header">
            <span className="hv-conversation-avatar" aria-hidden="true">{esAdmin ? "A" : "H"}</span>
            <div className="hv-conversation-header-copy">
              <strong>{esAdmin ? "Chat con el ciudadano" : "Administración HoodVoice"}</strong>
              <span><i /> Conversación de esta solicitud</span>
            </div>
            <button
              type="button"
              className="hv-conversation-collapse"
              onClick={() => setAbierta(false)}
              aria-label="Minimizar conversación"
              title="Minimizar conversación"
            >
              <span aria-hidden="true">⌃</span>
            </button>
          </header>

          {error && (
            <div className="hv-conversation-error" role="alert">
              <span>{error}</span>
              <button type="button" onClick={() => cargarMensajes(false)}>Reintentar</button>
            </div>
          )}

          <div className="hv-conversation-messages" ref={listaRef} aria-live="polite">
            {cargando && mensajesOrdenados.length === 0 ? (
              <div className="hv-conversation-state">Cargando conversación...</div>
            ) : mensajesOrdenados.length === 0 ? (
              <div className="hv-conversation-empty">
                <span aria-hidden="true">▤</span>
                <strong>Aún no hay mensajes</strong>
                <p>Escribe tu primera pregunta para iniciar la conversación sobre esta PQRS.</p>
              </div>
            ) : (
              mensajesOrdenados.map((item, index) => {
                const esPropio = String(item.rol || "").toUpperCase() === (esAdmin ? "ADMIN" : "USER");
                return (
                  <article
                    key={`${item.autor || item.rol || "mensaje"}-${item.fecha || index}-${index}`}
                    className={`hv-conversation-message ${esPropio ? "is-own" : "is-other"}`}
                  >
                    <div className="hv-conversation-message-meta">
                      <strong>{item.autor || (String(item.rol).toUpperCase() === "ADMIN" ? "Administrador" : "Ciudadano")}</strong>
                      <time>{fechaMensaje(item.fecha)}</time>
                    </div>
                    <p>{item.mensaje}</p>
                  </article>
                );
              })
            )}
          </div>

          <form className="hv-conversation-compose" onSubmit={enviarMensaje}>
            <label className="hv-conversation-compose-label" htmlFor={`hv-conversation-input-${pqrsId}`}>
              Escribe tu mensaje
            </label>
            <div className="hv-conversation-compose-row">
              <textarea
                id={`hv-conversation-input-${pqrsId}`}
                value={texto}
                onChange={(event) => setTexto(event.target.value)}
                placeholder="Escribe aquí tu pregunta o respuesta..."
                rows={2}
                maxLength={MAX_CARACTERES}
                disabled={enviando}
                required
              />
              <button
                type="submit"
                className="hv-conversation-send"
                disabled={enviando || !texto.trim()}
                aria-label="Enviar mensaje"
                title="Enviar mensaje"
              >
                {enviando ? "…" : "➤"}
              </button>
            </div>
            <div className="hv-conversation-compose-footer">
              <span>Evita compartir contraseñas o datos sensibles.</span>
              <span>{texto.length}/{MAX_CARACTERES}</span>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

export default ConversacionPQRS;
