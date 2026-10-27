import { useFeedback } from "./components/FeedbackProvider";

function Dashboard() {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch (error) {
    console.error("No se pudo leer la sesión guardada:", error);
  }

  const { confirmAction } = useFeedback();

  const logout = async () => {
    const accepted = await confirmAction(
      "Se cerrará tu sesión actual y volverás a la pantalla de bienvenida.",
      {
        title: "¿Deseas cerrar sesión?",
        confirmLabel: "Cerrar sesión",
        cancelLabel: "Continuar aquí",
        tone: "warning",
      }
    );

    if (!accepted) return;
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <main style={{ padding: "24px" }}>
      <h2>Dashboard</h2>
      {user ? (
        <>
          <p>Bienvenido: <strong>{user.username}</strong></p>
          <p>Rol: <strong>{user.role}</strong></p>
        </>
      ) : (
        <p>No hay sesión activa</p>
      )}
      <button type="button" onClick={logout}>Cerrar sesión</button>
    </main>
  );
}

export default Dashboard;
