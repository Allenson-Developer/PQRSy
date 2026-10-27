import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "../styles/portal.css";
import AppIcon from "./AppIcon";

function inicialesUsuario(user) {
  const source = String(user?.nombre || user?.username || "HV").trim();
  return source.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "HV";
}

export default function Navbar({ role = "USER", user, activeView, onNavigate, onLogout, onUserUpdated }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const profileWrapRef = useRef(null);
  const isAdmin = String(role).toUpperCase() === "ADMIN";
  const userId = user?.id || user?._id || user?.username || "account";
  const name = user?.nombre || user?.username || (isAdmin ? "Administrador" : "Usuario");
  const username = user?.username || name;

  const items = useMemo(() => isAdmin ? [
    { view: "inicio", label: "Inicio", icon: "home", description: "Vista general del centro de gestión" },
    { view: "ver", label: "Todas las PQRS", icon: "files", description: "Consultar y gestionar solicitudes" },
    { view: "stats", label: "Estadísticas globales", icon: "chart", description: "Indicadores generales del sistema" },
  ] : [
    { view: "inicio", label: "Inicio", icon: "home", description: "Accesos rápidos a tus funciones" },
    { view: "crear", label: "Crear PQRS", icon: "filePlus", description: "Registrar una nueva solicitud" },
    { view: "ver", label: "Mis solicitudes", icon: "files", description: "Consultar tus solicitudes y estados" },
    { view: "stats", label: "Estadísticas", icon: "chart", description: "Resumen de tus solicitudes" },
  ], [isAdmin]);

  useEffect(() => {
    const fromUser = user?.avatarUrl || user?.fotoPerfil || "";
    const fromStorage = localStorage.getItem(`hoodvoice-avatar-${userId}`) || "";
    setAvatarUrl(fromUser || fromStorage);
  }, [user?.avatarUrl, user?.fotoPerfil, userId]);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // Cierra el menú de perfil al pulsar fuera sin necesitar una capa fija dentro del header.
  useEffect(() => {
    if (!profileOpen) return undefined;
    const handleOutsidePointer = (event) => {
      if (!profileWrapRef.current?.contains(event.target)) setProfileOpen(false);
    };
    document.addEventListener("pointerdown", handleOutsidePointer);
    return () => document.removeEventListener("pointerdown", handleOutsidePointer);
  }, [profileOpen]);

  // El cajón se monta en document.body para que backdrop-filter del header no limite
  // su posición fixed ni lo recorte dentro de la barra de navegación.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [menuOpen]);

  const navigateTo = (view) => {
    setMenuOpen(false);
    setProfileOpen(false);
    onNavigate?.(view);
  };

  const handleAvatarError = () => setAvatarUrl("");

  return (
    <>
      <header className={`hv-topbar ${isAdmin ? "hv-topbar-admin" : "hv-topbar-user"}`}>
      <div className="hv-topbar-left">
        <button
          className={`hv-menu-trigger ${menuOpen ? "is-open" : ""}`}
          type="button"
          aria-label={menuOpen ? "Cerrar menú principal" : "Abrir menú principal"}
          aria-expanded={menuOpen}
          onClick={() => { setMenuOpen((value) => !value); setProfileOpen(false); }}
        >
          <span /><span /><span />
        </button>
        <span className="hv-brand-divider" aria-hidden="true" />
        <button type="button" className="hv-brand-lockup" onClick={() => navigateTo("inicio")} aria-label="HoodVoice Cartagena, ir al inicio">
          <img className="hv-brand-symbol" src="/hoodvoice-symbol.png" alt="" />
          <span className="hv-brand-wordmark"><strong>HOOD<span>VOICE</span></strong><small>CARTAGENA</small></span>
        </button>
      </div>

      <div className="hv-topbar-right">
        <div className="hv-profile-wrap" ref={profileWrapRef}>
          <button
            type="button"
            className={`hv-profile-trigger ${profileOpen ? "is-open" : ""}`}
            aria-expanded={profileOpen}
            aria-label="Abrir menú de perfil"
            onClick={() => { setProfileOpen((value) => !value); setMenuOpen(false); }}
          >
            <span className="hv-avatar">
              {avatarUrl ? <img src={avatarUrl} alt="Foto de perfil" onError={handleAvatarError} /> : <span>{inicialesUsuario(user)}</span>}
            </span>
            <span className="hv-profile-name"><strong>{username}</strong><small>{isAdmin ? "Administrador" : "Cuenta personal"}</small></span>
            <AppIcon name="chevronDown" size={18} className="hv-profile-chevron" />
          </button>
          {profileOpen && (
            <>
              <div className="hv-profile-popover">
                <div className="hv-popover-account">
                  <span className="hv-avatar hv-avatar-large">
                    {avatarUrl ? <img src={avatarUrl} alt="" onError={handleAvatarError} /> : <span>{inicialesUsuario(user)}</span>}
                  </span>
                  <div><strong>{name}</strong><span>{user?.email || "Correo no disponible"}</span></div>
                </div>
                {!isAdmin && <button type="button" className="hv-popover-item" onClick={() => navigateTo("perfil")}><AppIcon name="user" size={19}/> Mi perfil <AppIcon name="chevronRight" size={16} className="hv-popover-arrow"/></button>}
                {isAdmin && <div className="hv-popover-role"><AppIcon name="shield" size={18}/> Acceso administrativo</div>}
                <button type="button" className="hv-popover-logout" onClick={() => { setProfileOpen(false); onLogout?.(); }}><AppIcon name="logout" size={19}/> Cerrar sesión</button>
              </div>
            </>
          )}
        </div>
      </div>

      </header>

      {menuOpen && typeof document !== "undefined" && createPortal(
        <>
          <button type="button" className="hv-drawer-scrim" aria-label="Cerrar menú principal" onClick={() => setMenuOpen(false)} />
          <aside className="hv-navigation-drawer" aria-label="Navegación principal" role="dialog" aria-modal="true">
            <div className="hv-drawer-brand">
              <img src="/hoodvoice-symbol.png" alt="" />
              <div><strong>HOOD<span>VOICE</span></strong><small>CARTAGENA</small></div>
            </div>
            <p className="hv-drawer-section-label">MENÚ PRINCIPAL</p>
            <nav className="hv-drawer-nav">
              {items.map((item) => (
                <button key={item.view} type="button" className={`hv-drawer-item ${activeView === item.view || (activeView === "detalle" && item.view === "ver") ? "is-active" : ""}`} onClick={() => navigateTo(item.view)}>
                  <span className="hv-drawer-item-icon"><AppIcon name={item.icon} size={20}/></span>
                  <span className="hv-drawer-item-copy"><strong>{item.label}</strong><small>{item.description}</small></span>
                  <AppIcon name="chevronRight" size={17} className="hv-drawer-item-arrow"/>
                </button>
              ))}
            </nav>
            <div className="hv-drawer-footer">
              <div className="hv-drawer-help"><AppIcon name="info" size={19}/><span><strong>HoodVoice Cartagena</strong><small>Atención y gestión de solicitudes</small></span></div>
              <button type="button" className="hv-drawer-logout" onClick={() => { setMenuOpen(false); onLogout?.(); }}><AppIcon name="logout" size={19}/> Cerrar sesión</button>
            </div>
          </aside>
        </>,
        document.body
      )}
    </>
  );
}
