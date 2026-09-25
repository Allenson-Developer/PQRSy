import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import Login from "./Login";

function Home() {
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="home">
      <div className="overlay">
       <h1 className="logo">PQRS</h1>
        <p>Gestión de Peticiones, Quejas y Reclamos</p>

        <div className="buttons">
          <button onClick={() => navigate("/register")}>
            REGISTRARSE
          </button>

          <button onClick={() => setShowLogin(true)}>
            INICIAR SESIÓN
          </button>
        </div>
      </div>

      {/*  MODAL LOGIN */}
      {showLogin && (
        <div className="modal">
          <div className="modal-content">
            <span
              className="close"
              onClick={() => setShowLogin(false)}
            >
              ✖
            </span>

            <Login close={() => setShowLogin(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;