import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login({ close }) {
  const navigate = useNavigate();

  const [modo, setModo] = useState("USER"); //  NUEVO
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [documento, setDocumento] = useState(""); //  NUEVO

  const iniciarSesion = async () => {
    if (!username || !password) {
      alert("Completa todos los campos");
      return;
    }

    //  VALIDACIÓN ADMIN
    if (modo === "ADMIN" && !documento) {
      alert("Ingresa el ID de administrador");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/test/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          documento: modo === "ADMIN" ? documento : null, //  NUEVO
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        alert(error);
        return;
      }

      const data = await response.json();

      //  VALIDACIÓN CRÍTICA
      if (!data || !data.id) {
        alert("Error en respuesta del servidor");
        return;
      }

      //  ASEGURAR ROLE (CLAVE DEL ADMIN)
      const userData = {
        ...data,
        role: data.role || "USER",
      };

      //  GUARDAR
      localStorage.setItem("user", JSON.stringify(userData));

      localStorage.setItem(
      "token",
      data.token
     );

      alert("Login exitoso");

      //  REDIRECCIÓN CORRECTA
      if (userData.role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/user");
      }

      close();
    } catch (error) {
      console.error(error);
      alert("Error de conexión");
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-box">
        <span className="close" onClick={close}>
          ×
        </span>

        <h2>Sign in</h2>

        {/*  SELECTOR USER / ADMIN */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <button
            onClick={() => setModo("USER")}
            style={{
              flex: 1,
              background: modo === "USER" ? "#f4c430" : "#2a2a2a",
              color: modo === "USER" ? "black" : "white",
            }}
          >
            USER
          </button>

          <button
            onClick={() => setModo("ADMIN")}
            style={{
              flex: 1,
              background: modo === "ADMIN" ? "#f4c430" : "#2a2a2a",
              color: modo === "ADMIN" ? "black" : "white",
            }}
          >
            ADMIN
          </button>
        </div>

        <input
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/*  INPUT SOLO PARA ADMIN */}
        {modo === "ADMIN" && (
          <input
            type="text"
            placeholder="ID Administrador"
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
          />
        )}

        <div className="options">
          <label>
            <input type="checkbox" /> Remember me
          </label>
          <span>Forgot password?</span>
        </div>

        <button onClick={iniciarSesion}>Sign in</button>

        <div className="register-link">
          Don't have an account?{" "}
          <span onClick={() => navigate("/register")}>
            Register
          </span>
        </div>
      </div>
    </div>
  );
}

export default Login;