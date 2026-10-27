# HoodVoice Cartagena — Rediseño del frontend

Esta entrega aplica una dirección visual unificada basada en el logo de HoodVoice Cartagena: amarillo, azul marino y blanco. Incluye navegación superior con menú hamburguesa y perfil desplegable, dashboards separados para usuario y administrador, tarjetas visuales, formularios renovados, estadísticas con gráficos, detalle de solicitudes y ventanas de confirmación personalizadas.

## Instalación

1. Haz una copia de seguridad de las carpetas `src` y `public` actuales.
2. Descomprime este paquete en la raíz del proyecto existente y permite reemplazar los archivos correspondientes de `src` y `public`.
3. Conserva el `package.json`, `index.html`, la configuración de Vite y los demás archivos raíz de tu proyecto. No se incluyeron en los ZIP que recibí, por lo que esta entrega no los reemplaza.
4. Comprueba que exista `public/hoodvoice-symbol.png` (viene incluido en esta entrega).
5. Desde la terminal del proyecto ejecuta `npm run dev` como normalmente lo haces.
6. Prueba ambas cuentas y los recorridos principales antes de dar por cerrado el rediseño.

## Archivos importantes

- `src/pages/UserDashboard.jsx` y `src/pages/UserDashboard.css`: panel, creación y consulta de PQRS, perfil y estadísticas del usuario.
- `src/pages/AdminDashboard.jsx` y `src/pages/adminDashboard.css`: panel y estilos independientes de administración.
- `src/pages/DetallePQRS.jsx`: detalle y seguimiento del usuario.
- `src/pages/DetallePQRSAdmin.jsx`: detalle y gestión administrativa.
- `src/components/Navbar.jsx`: barra superior, menú hamburguesa y menú de perfil.
- `src/components/FeedbackProvider.jsx` y su CSS: diálogos personalizados de confirmación, información y error.
- `src/pages/Home.jsx`, `Login.jsx`, `Register.jsx` y sus CSS: bienvenida y autenticación con la marca HoodVoice.

## Comprobaciones realizadas

- Análisis sintáctico de los 13 archivos `.js`/`.jsx`: sin errores detectados.
- Análisis de los 9 archivos CSS: sin errores de parseo.
- Imports relativos: todos resuelven a archivos presentes en la entrega.
- Diálogos nativos `alert`, `confirm` y `prompt`: no se detectaron en el flujo activo revisado.

No pude ejecutar `npm run build` ni probar en un navegador desde este paquete porque no se incluyó `package.json` ni el entorno `node_modules`. La verificación anterior es estática y no sustituye las pruebas dentro de tu proyecto.

## Dependencias y puntos que siguen pendientes

- La aplicación conserva las rutas del backend existente en `http://localhost:8080`; el backend no se modifica en esta entrega.
- El formulario de crear PQRS envía `nombre`, `documento`, `identificacion` y `email` junto con los campos existentes. Para que esos datos se guarden y regresen al consultar la PQRS, el modelo/controlador del backend debe admitirlos y persistirlos.
- El código de PQRS se muestra si el backend devuelve `codigoPQRS`, `codigoPqrs`, `codigo`, `numeroRadicado`, `id` o `_id`. Si no devuelve un código propio, la interfaz usa una referencia del registro; no inventa un código.
- La fotografía de perfil se comprime en el navegador y se guarda en `localStorage` de ese navegador. No se sube a MongoDB ni se sincroniza entre dispositivos.
- El correo del perfil es de solo lectura con las operaciones actuales del backend.
- El seguimiento del usuario sigue consultando `GET /historial/cliente/pqrs/{id}`. En las pruebas previas esa consulta devolvió `403`; esta entrega mejora su presentación de errores, pero no corrige las reglas de seguridad del backend.
- Las fotografías de los banners usan URLs de Unsplash y necesitan conexión a Internet. Los fondos de degradado sirven como alternativa visual si no cargan.

## Recomendación para validar

Prueba primero: inicio de sesión por rol, navegación de usuario y administrador, creación de PQRS con y sin archivo, edición de descripción, cancelación/eliminación según el comportamiento actual del endpoint, acceso a estadísticas, apertura de adjuntos y gestión administrativa. Después revisa el seguimiento del usuario para comprobar el estado real del endpoint protegido.
