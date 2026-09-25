import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AdminDashboard from "./pages/AdminDashboard";
import DetallePQRS from "./pages/DetallePQRS";
import DetallePQRSAdmin from "./pages/DetallePQRSAdmin";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";

//////////////////////////////////////////////////
// PROTEGER RUTA USER
//////////////////////////////////////////////////

function RutaUser({ children }) {

  const user =
    JSON.parse(localStorage.getItem("user"));

  //////////////////////////////////////////////
  // NO LOGUEADO
  //////////////////////////////////////////////

  if (!user) {

    return <Navigate to="/" />;
  }

  //////////////////////////////////////////////
  // NO ES USER
  //////////////////////////////////////////////

  if (
    user.role?.toUpperCase() !== "USER"
  ) {

    return <Navigate to="/" />;
  }

  return children;
}

//////////////////////////////////////////////////
// PROTEGER RUTA ADMIN
//////////////////////////////////////////////////

function RutaAdmin({ children }) {

  const user =
    JSON.parse(localStorage.getItem("user"));

  //////////////////////////////////////////////
  // NO LOGUEADO
  //////////////////////////////////////////////

  if (!user) {

    return <Navigate to="/" />;
  }

  //////////////////////////////////////////////
  // NO ES ADMIN
  //////////////////////////////////////////////

  if (
    user.role?.toUpperCase() !== "ADMIN"
  ) {

    return <Navigate to="/" />;
  }

  return children;
}

//////////////////////////////////////////////////
// APP
//////////////////////////////////////////////////

function App() {

  return (

    <BrowserRouter>

      <Routes>

        {/* HOME */}

        <Route
          path="/"
          element={<Home />}
        />

        {/* LOGIN */}

        <Route
          path="/login"
          element={<Login />}
        />

        {/* REGISTER */}

        <Route
          path="/register"
          element={<Register />}
        />

        {/* =========================================
            USER
        ========================================= */}

        <Route
          path="/user"
          element={
            <RutaUser>

              <UserDashboard />

            </RutaUser>
          }
        />

        <Route
          path="/detalle/:id"
          element={
            <RutaUser>

              <DetallePQRS />

            </RutaUser>
          }
        />

        {/* =========================================
            ADMIN
        ========================================= */}

        <Route
          path="/admin"
          element={
            <RutaAdmin>

              <AdminDashboard />

            </RutaAdmin>
          }
        />

        <Route
          path="/detalle-admin/:id"
          element={
            <RutaAdmin>

              <DetallePQRSAdmin />

            </RutaAdmin>
          }
        />

        {/* =========================================
            RUTA NO ENCONTRADA
        ========================================= */}

        <Route
          path="*"
          element={<Navigate to="/" />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;