import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import AppIcon from "./AppIcon";
import "./FeedbackProvider.css";

const FeedbackContext = createContext(null);

const TONE_CONFIG = {
  info: { icon: "info", title: "Información" },
  success: { icon: "checkCircle", title: "¡Listo!" },
  warning: { icon: "alert", title: "Confirma esta acción" },
  danger: { icon: "trash", title: "¿Deseas continuar?" },
  error: { icon: "xCircle", title: "No se pudo completar" },
};

export function FeedbackProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const resolverRef = useRef(null);
  const inputRef = useRef(null);

  const openDialog = useCallback((config) => new Promise((resolve) => {
    if (resolverRef.current) resolverRef.current(null);
    resolverRef.current = resolve;
    setInputValue(config.defaultValue ?? "");
    setDialog({ tone: "info", ...config });
  }), []);

  const notify = useCallback((message, options = {}) => openDialog({
    kind: "alert",
    message,
    title: options.title || TONE_CONFIG[options.tone || "info"].title,
    tone: options.tone || "info",
    confirmLabel: options.confirmLabel || "Entendido",
  }), [openDialog]);

  const confirmAction = useCallback((message, options = {}) => openDialog({
    kind: "confirm",
    message,
    title: options.title || TONE_CONFIG[options.tone || "warning"].title,
    tone: options.tone || "warning",
    confirmLabel: options.confirmLabel || "Confirmar",
    cancelLabel: options.cancelLabel || "Volver",
    detail: options.detail || "",
  }).then(Boolean), [openDialog]);

  const askText = useCallback((message, defaultValue = "", options = {}) => openDialog({
    kind: "prompt",
    message,
    defaultValue,
    title: options.title || "Actualizar información",
    tone: options.tone || "info",
    confirmLabel: options.confirmLabel || "Guardar cambios",
    cancelLabel: options.cancelLabel || "Cancelar",
    inputLabel: options.inputLabel || "Descripción",
    placeholder: options.placeholder || "Escribe aquí...",
    multiline: options.multiline !== false,
  }).then((result) => typeof result === "string" ? result : null), [openDialog]);

  const finish = useCallback((result) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setDialog(null);
    if (resolve) resolve(result);
  }, []);

  useEffect(() => {
    if (!dialog) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        finish(dialog.kind === "alert" ? true : null);
        return;
      }
      // No interceptamos Enter en las ventanas de confirmación: el navegador
      // activa el botón enfocado y así la tecla no puede confirmar por error
      // cuando el usuario tiene seleccionado el botón secundario.
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter" && dialog.kind === "prompt") {
        event.preventDefault();
        finish(inputValue);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [dialog, finish, inputValue]);

  useEffect(() => {
    if (dialog?.kind === "prompt") inputRef.current?.focus();
  }, [dialog]);

  const tone = dialog ? (TONE_CONFIG[dialog.tone] || TONE_CONFIG.info) : TONE_CONFIG.info;

  return (
    <FeedbackContext.Provider value={{ notify, confirmAction, askText }}>
      {children}
      {dialog && (
        <div className="hv-dialog-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) finish(dialog.kind === "alert" ? true : null);
        }}>
          <section
            className={`hv-dialog hv-dialog-${dialog.tone || "info"}`}
            role={dialog.kind === "alert" ? "alertdialog" : "dialog"}
            aria-modal="true"
            aria-labelledby="hv-dialog-title"
            aria-describedby="hv-dialog-message"
          >
            <div className="hv-dialog-topline">
              <div className="hv-dialog-icon"><AppIcon name={tone.icon} size={25}/></div>
              <button type="button" className="hv-dialog-close" aria-label="Cerrar ventana" onClick={() => finish(dialog.kind === "alert" ? true : null)}>
                <AppIcon name="close" size={19}/>
              </button>
            </div>
            <h2 id="hv-dialog-title">{dialog.title}</h2>
            <p className="hv-dialog-message" id="hv-dialog-message">{dialog.message}</p>
            {dialog.detail && <div className="hv-dialog-detail">{dialog.detail}</div>}
            {dialog.kind === "prompt" && (
              <label className="hv-dialog-field">
                <span>{dialog.inputLabel}</span>
                {dialog.multiline ? (
                  <textarea ref={inputRef} rows={5} value={inputValue} placeholder={dialog.placeholder} onChange={(event) => setInputValue(event.target.value)} />
                ) : (
                  <input ref={inputRef} value={inputValue} placeholder={dialog.placeholder} onChange={(event) => setInputValue(event.target.value)} />
                )}
              </label>
            )}
            <div className="hv-dialog-actions">
              {dialog.kind !== "alert" && (
                <button type="button" className="hv-dialog-button hv-dialog-secondary" onClick={() => finish(null)}>
                  {dialog.cancelLabel || "Cancelar"}
                </button>
              )}
              <button
                type="button"
                className={`hv-dialog-button hv-dialog-primary ${dialog.tone === "danger" || dialog.tone === "error" ? "is-danger" : ""}`}
                onClick={() => finish(dialog.kind === "prompt" ? inputValue : true)}
              >
                {dialog.confirmLabel || "Continuar"}
              </button>
            </div>
            <p className="hv-dialog-brand">HOODVOICE <span>CARTAGENA</span></p>
          </section>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error("useFeedback debe utilizarse dentro de FeedbackProvider");
  return context;
}
