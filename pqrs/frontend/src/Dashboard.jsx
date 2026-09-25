function Dashboard() {

  const user =
    JSON.parse(
      localStorage.getItem("user")
    );

  //////////////////////////////////////////////////
  // CERRAR SESIÓN
  //////////////////////////////////////////////////

  const logout = () => {

    if (
      window.confirm(
        "¿Seguro que deseas cerrar sesión?"
      )
    ) {

      localStorage.removeItem("user");

      window.location.href = "/";
    }
  };

  //////////////////////////////////////////////////
  // RENDER
  //////////////////////////////////////////////////

  return (

    <div
      style={{
        padding: "20px",
      }}
    >

      <h2>
        Dashboard
      </h2>

      {user ? (

        <>

          <p>

            Bienvenido:{" "}

            <strong>
              {user.username}
            </strong>

          </p>

          <p>

            Rol:{" "}

            <strong>
              {user.role}
            </strong>

          </p>

        </>

      ) : (

        <p>
          No hay sesión activa
        </p>

      )}

      <button
        onClick={logout}
      >
        Cerrar sesión
      </button>

    </div>
  );
}

export default Dashboard;