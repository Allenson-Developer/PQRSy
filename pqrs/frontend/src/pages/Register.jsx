import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";

function Register() {
  const navigate = useNavigate();

  //  SOLO USER (SE ELIMINA ADMIN)
  const [nombre, setNombre] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const registrar = async () => {
    if (!nombre || !username || !password) {
      alert("Completa todos los campos");
      return;
    }

    try {
      const body = {
        nombre,
        username,
        password,
        role: "USER", //  SIEMPRE USER
      };

      const response = await fetch("http://localhost:8080/test/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        alert("Registro exitoso");
        navigate("/");
      } else {
        alert("Error en registro");
      }
    } catch (error) {
      alert("Error de conexión");
    }
  };

  return (
    <div className="register-page">
      <div className="register-box">
        <h2>Register</h2>

        <div className="form">
          <input
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />

          <input
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

          <button onClick={registrar}>
            Registrarse
          </button>
        </div>

        <p className="login-link">
          ¿Ya tienes cuenta?{" "}
          <span onClick={() => navigate("/")}>
            Iniciar sesión
          </span>
        </p>
      </div>
    </div>
  );
}

export default Register;