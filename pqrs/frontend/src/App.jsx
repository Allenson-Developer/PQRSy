import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { FeedbackProvider } from "./components/FeedbackProvider";
import AdminDashboard from "./pages/AdminDashboard";
import DetallePQRS from "./pages/DetallePQRS";
import DetallePQRSAdmin from "./pages/DetallePQRSAdmin";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";

function leerUsuario() {
  try { return JSON.parse(localStorage.getItem("user") || "null"); }
  catch { return null; }
}

function RutaUser({ children }) {
  const user = leerUsuario();
  if (!user || String(user.role || "").toUpperCase() !== "USER") return <Navigate to="/" replace />;
  return children;
}

function RutaAdmin({ children }) {
  const user = leerUsuario();
  if (!user || String(user.role || "").toUpperCase() !== "ADMIN") return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/user" element={<RutaUser><UserDashboard /></RutaUser>} />
        <Route path="/detalle/:id" element={<RutaUser><DetallePQRS /></RutaUser>} />
        <Route path="/admin" element={<RutaAdmin><AdminDashboard /></RutaAdmin>} />
        <Route path="/detalle-admin/:id" element={<RutaAdmin><DetallePQRSAdmin /></RutaAdmin>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return <FeedbackProvider><AppRoutes /></FeedbackProvider>;
}
