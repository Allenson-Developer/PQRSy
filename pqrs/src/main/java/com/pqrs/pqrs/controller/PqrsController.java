package com.pqrs.pqrs.controller;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.pqrs.pqrs.model.HistorialPQRS;
import com.pqrs.pqrs.model.Pqrs;
import com.pqrs.pqrs.model.Respuesta;
import com.pqrs.pqrs.model.Usuario;
import com.pqrs.pqrs.repository.HistorialPQRSRepository;
import com.pqrs.pqrs.repository.PqrsRepository;
import com.pqrs.pqrs.repository.UsuarioRepository;
@RestController
@RequestMapping("/pqrs")
@CrossOrigin(origins = "*")
public class PqrsController {

    @Autowired
    private PqrsRepository repo;

    @Autowired
    private UsuarioRepository usuarioRepo;

    @Autowired
    private HistorialPQRSRepository historialRepo;

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

  //////////////////////////////////////////////////////
  // SEGURIDAD - USUARIO AUTENTICADO
  //////////////////////////////////////////////////////

   private Usuario obtenerUsuarioAutenticado() {

    Authentication auth =
            SecurityContextHolder.getContext().getAuthentication();

    if (auth == null || !auth.isAuthenticated()) {
        return null;
    }

    return usuarioRepo.findByUsername(auth.getName()).orElse(null);
   }

   private boolean esAdmin() {

    Usuario usuario = obtenerUsuarioAutenticado();

    return usuario != null
            && "ADMIN".equalsIgnoreCase(usuario.getRole());
 }

   private boolean esPropietario(String usuarioId) {

    Usuario usuario = obtenerUsuarioAutenticado();

    return usuario != null
            && usuario.getId() != null
            && usuario.getId().equals(usuarioId);
}

    //////////////////////////////////////////////////////
    // TEST
    //////////////////////////////////////////////////////
    @GetMapping("/test")
    public String test() {
        return "FUNCIONA";
    }

    //////////////////////////////////////////////////////
    // CREAR PQRS
    //////////////////////////////////////////////////////
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> crear(@RequestParam("tipo") String tipo,
                                   @RequestParam("descripcion") String descripcion,
                                   @RequestParam("usuarioId") String usuarioId,
                                   @RequestParam(value = "archivo", required = false) MultipartFile archivo) {

        try {
            // El ID enviado desde el navegador no se considera confiable por sí solo.
            // La PQRS debe pertenecer al usuario autenticado en el token.
            Usuario usuarioAutenticado = obtenerUsuarioAutenticado();
            if (usuarioAutenticado == null || usuarioAutenticado.getId() == null) {
                return ResponseEntity.status(401)
                        .body("No se pudo identificar al usuario autenticado.");
            }

            if (!usuarioAutenticado.getId().equals(usuarioId)) {
                return ResponseEntity.status(403)
                        .body("No puedes crear una PQRS a nombre de otro usuario.");
            }

            Pqrs pqrs = new Pqrs();
            pqrs.setTipo(tipo);
            pqrs.setDescripcion(descripcion);
            pqrs.setUsuarioId(usuarioAutenticado.getId());
            pqrs.setUsername(usuarioAutenticado.getUsername());
            pqrs.setNombre(usuarioAutenticado.getNombre());
            pqrs.setFecha(new Date());
            pqrs.setEstado("PENDIENTE");
            pqrs.setPrioridad("MEDIA");

            if (archivo != null && !archivo.isEmpty()) {
                Path directorio = Paths.get(uploadDir).toAbsolutePath().normalize();
                Files.createDirectories(directorio);

                String nombreArchivo = System.currentTimeMillis() + "_" + archivo.getOriginalFilename();
                Path ruta = directorio.resolve(nombreArchivo).normalize();
                Files.write(ruta, archivo.getBytes());
                pqrs.setArchivo(nombreArchivo);
            }

            Pqrs pqrsGuardada = repo.save(pqrs);

            HistorialPQRS historial = new HistorialPQRS();
            historial.setPqrsId(pqrsGuardada.getId());
            historial.setAccion("CREAR_PQRS");
            historial.setEstadoAnterior(null);
            historial.setEstadoNuevo("PENDIENTE");
            historial.setFecha(new Date());
            historial.setResponsable(
                    usuarioAutenticado.getNombre() != null
                            ? usuarioAutenticado.getNombre()
                            : usuarioAutenticado.getUsername()
            );
            historial.setComentarioInterno("PQRS creada correctamente.");
            historial.setMensajeCliente("Tu PQRS fue creada exitosamente.");
            historial.setVisibleCliente(true);
            historial.setDetalle("Tipo: " + tipo);
            historialRepo.save(historial);

            return ResponseEntity.ok(pqrsGuardada);

        } catch (IOException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("mensaje", "Error al subir archivo");
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    //////////////////////////////////////////////////////
    // RESPONDER PQRS
    //////////////////////////////////////////////////////
    @PutMapping("/{id}/responder")
    public ResponseEntity<?> responder(@PathVariable String id, @RequestBody Map<String, String> body) {
        return registrarRespuesta(id, body);
    }

    // Ruta utilizada actualmente por el panel administrativo (POST /pqrs/responder/{id}).
    // Se conserva también la ruta PUT anterior para no romper integraciones existentes.
    @PostMapping("/responder/{id}")
    public ResponseEntity<?> responderDesdePanel(@PathVariable String id, @RequestBody Map<String, String> body) {
        return registrarRespuesta(id, body);
    }

    private ResponseEntity<?> registrarRespuesta(String id, Map<String, String> body) {
        try {
            Optional<Pqrs> pqrsOpt = repo.findById(id);
            if (pqrsOpt.isEmpty()) return ResponseEntity.status(404).body("PQRS no encontrada");

            Pqrs pqrs = pqrsOpt.get();
            Usuario usuarioAutenticado = obtenerUsuarioAutenticado();
            if (usuarioAutenticado == null) {
                return ResponseEntity.status(401).body("Debes iniciar sesión para responder esta PQRS.");
            }

            boolean esPropietario = usuarioAutenticado.getId() != null
                    && usuarioAutenticado.getId().equals(pqrs.getUsuarioId());
            if (!"ADMIN".equalsIgnoreCase(usuarioAutenticado.getRole())
                    && !esPropietario) {
                return ResponseEntity.status(403)
                        .body("No tienes permiso para responder esta PQRS.");
            }

            // El panel actual envía "mensaje"; se mantiene "respuesta" por compatibilidad
            // con la ruta PUT anterior.
            String mensaje = body.get("mensaje");
            if (mensaje == null || mensaje.trim().isEmpty()) {
                mensaje = body.get("respuesta");
            }
            if (mensaje == null || mensaje.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("La respuesta no puede estar vacía");
            }
            mensaje = mensaje.trim();

            String nombreResponsable = usuarioAutenticado.getNombre() != null
                    && !usuarioAutenticado.getNombre().trim().isEmpty()
                    ? usuarioAutenticado.getNombre().trim()
                    : usuarioAutenticado.getUsername();

            Respuesta respuesta = new Respuesta();
            respuesta.setMensaje(mensaje);
            respuesta.setAutor(nombreResponsable != null ? nombreResponsable : "Usuario");
            respuesta.setRol(usuarioAutenticado.getRole());
            respuesta.setFecha(new Date());

            if (pqrs.getRespuestas() == null) pqrs.setRespuestas(new ArrayList<>());
            pqrs.getRespuestas().add(respuesta);

            if (pqrs.getFechaPrimeraRespuesta() == null) {
                pqrs.setFechaPrimeraRespuesta(new Date());
            }
            repo.save(pqrs);

            HistorialPQRS historial = new HistorialPQRS();
            historial.setPqrsId(pqrs.getId());
            historial.setAccion("RESPUESTA");
            historial.setEstadoAnterior(pqrs.getEstado());
            historial.setEstadoNuevo(pqrs.getEstado());
            historial.setFecha(new Date());
            historial.setResponsable(nombreResponsable != null ? nombreResponsable : "Sistema");
            historial.setComentarioInterno("Se agregó una respuesta al PQRS.");
            historial.setMensajeCliente(mensaje);
            historial.setVisibleCliente(true);
            historial.setDetalle("Se respondió la PQRS");
            historialRepo.save(historial);

            return ResponseEntity.ok(pqrs);

        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("mensaje", "Error al responder PQRS");
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    //////////////////////////////////////////////////////
    // LISTAR POR USUARIO
    //////////////////////////////////////////////////////
    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<?> listarPorUsuario(@PathVariable String usuarioId) {

    if (!esAdmin() && !esPropietario(usuarioId)) {
        return ResponseEntity.status(403)
                .body("No tienes permiso para consultar las PQRS de este usuario");
    }

    return ResponseEntity.ok(repo.findByUsuarioId(usuarioId));
  }

   @GetMapping("/usuario/{usuarioId}/estado")
       public ResponseEntity<?> filtrarPorEstado(
        @PathVariable String usuarioId,
        @RequestParam String estado) {

        if (!esAdmin() && !esPropietario(usuarioId)) {
         return ResponseEntity.status(403)
                .body("No tienes permiso para consultar las PQRS de este usuario");
    }

    List<Pqrs> lista = repo.findByUsuarioId(usuarioId);

    List<Pqrs> filtradas = lista.stream()
            .filter(p -> p.getEstado() != null
                    && p.getEstado().equalsIgnoreCase(estado))
            .toList();

    return ResponseEntity.ok(filtradas);
  }


   @GetMapping("/prioridad/{prioridad}")
     public ResponseEntity<?> listarPorPrioridad(
        @PathVariable String prioridad
    ) {

    return ResponseEntity.ok(
            repo.findByPrioridad(
                    prioridad.toUpperCase()
            )
    ); 
 }

   @GetMapping("/estado/{estado}/prioridad/{prioridad}")
     public ResponseEntity<?> listarPorEstadoYPrioridad(

        @PathVariable String estado,

        @PathVariable String prioridad
    ) {

    return ResponseEntity.ok(

            repo.findByEstadoAndPrioridad(

                    estado.toUpperCase(),

                    prioridad.toUpperCase()
            )
    );
 }



 //////////////////////////////////////////////////////
 // EDITAR PQRS
  //////////////////////////////////////////////////////
  @PutMapping("/{id}")
  public ResponseEntity<?> actualizar(
        @PathVariable String id,
        @RequestBody Pqrs datos) {

     try {

        Optional<Pqrs> pqrsOpt = repo.findById(id);

        if (pqrsOpt.isEmpty()) {
            return ResponseEntity.status(404)
                    .body("PQRS no encontrada");
        }

        Pqrs pqrs = pqrsOpt.get();

        // Verificar que la PQRS pertenezca al usuario autenticado
        if (!esPropietario(pqrs.getUsuarioId())) {
            return ResponseEntity.status(403)
                    .body("No tienes permiso para editar esta PQRS");
        }

        String estadoAnterior = pqrs.getEstado();

        // El usuario puede editar estos datos
        if (datos.getTipo() != null) {
            pqrs.setTipo(datos.getTipo());
        }

        if (datos.getDescripcion() != null) {
            pqrs.setDescripcion(datos.getDescripcion());
        }

        // El estado NO se modifica desde este endpoint.
        // El cambio de estado se realiza mediante /{id}/estado,
        // protegido para ADMIN.

        repo.save(pqrs);

        // Registrar la edición en el historial
        HistorialPQRS historial = new HistorialPQRS();

        historial.setPqrsId(pqrs.getId());
        historial.setAccion("ACTUALIZACION");
        historial.setEstadoAnterior(estadoAnterior);
        historial.setEstadoNuevo(estadoAnterior);
        historial.setFecha(new Date());
        historial.setResponsable("Usuario");
        historial.setComentarioInterno(
                "El usuario actualizó su PQRS."
        );
        historial.setMensajeCliente(
                "Tu PQRS fue actualizada correctamente."
        );
        historial.setVisibleCliente(true);
        historial.setDetalle(
                "Se actualizaron los datos de la PQRS"
        );

        historialRepo.save(historial);

        return ResponseEntity.ok(pqrs);

    } catch (Exception e) {

        Map<String, Object> response = new HashMap<>();

        response.put(
                "mensaje",
                "Error al actualizar PQRS"
        );

        response.put(
                "error",
                e.getMessage()
        );

        return ResponseEntity.status(500)
                .body(response);
    }
 }

 //////////////////////////////////////////////////////
 // ELIMINAR PQRS
 //////////////////////////////////////////////////////
   @DeleteMapping("/{id}")
   public ResponseEntity<?> eliminar(@PathVariable String id) {
    try {

        Optional<Pqrs> pqrsOpt = repo.findById(id);

        if (pqrsOpt.isEmpty()) {
            return ResponseEntity.status(404)
                    .body("PQRS no encontrada");
        }

        Pqrs pqrs = pqrsOpt.get();

        // Verificar que la PQRS pertenezca al usuario autenticado
        if (!esPropietario(pqrs.getUsuarioId())) {
            return ResponseEntity.status(403)
                    .body("No tienes permiso para eliminar esta PQRS");
        }

        // Eliminar historial asociado
        List<HistorialPQRS> historial =
                historialRepo.findByPqrsIdOrderByFechaAsc(id);

        historialRepo.deleteAll(historial);

        // Eliminar PQRS
        repo.deleteById(id);

        return ResponseEntity.ok("PQRS eliminada");

    } catch (Exception e) {
        return ResponseEntity.status(500)
                .body("Error al eliminar PQRS");
    }
 }

    //////////////////////////////////////////////////////
    // DASHBOARD USER
    //////////////////////////////////////////////////////
  @GetMapping("/estadisticas/{usuarioId}")
  public ResponseEntity<?> estadisticas(@PathVariable String usuarioId) {

    if (!esAdmin() && !esPropietario(usuarioId)) {
        return ResponseEntity.status(403)
                .body("No tienes permiso para consultar estas estadísticas");
    }

    List<Pqrs> lista = repo.findByUsuarioId(usuarioId);

    long total = lista.size();

    long pendientes = lista.stream()
            .filter(p -> "PENDIENTE".equalsIgnoreCase(p.getEstado()))
            .count();

    long proceso = lista.stream()
            .filter(p -> "PROCESO".equalsIgnoreCase(p.getEstado()))
            .count();

    long resueltas = lista.stream()
            .filter(p -> "RESUELTO".equalsIgnoreCase(p.getEstado()))
            .count();

    Map<String, Object> stats = new HashMap<>();

    stats.put("total", total);
    stats.put("pendientes", pendientes);
    stats.put("proceso", proceso);
    stats.put("resueltas", resueltas);

    return ResponseEntity.ok(stats);
  }

    //////////////////////////////////////////////////////
    // ADMIN PANEL
    //////////////////////////////////////////////////////
    @GetMapping("/todas")
    public ResponseEntity<List<Pqrs>> listarTodas() {
        return ResponseEntity.ok(repo.findAll());
    }

    //////////////////////////////////////////////////////
    // CAMBIAR ESTADO
    //////////////////////////////////////////////////////
    @PutMapping("/{id}/estado")
    public ResponseEntity<?> cambiarEstado(@PathVariable String id,
                                           @RequestParam String estado,
                                           @RequestParam(required = false) String responsable) {
        try {
            Optional<Pqrs> pqrsOpt = repo.findById(id);
            if (pqrsOpt.isEmpty()) return ResponseEntity.status(404).body("PQRS no encontrada");

            Pqrs pqrs = pqrsOpt.get();
            String estadoAnterior = pqrs.getEstado();
            pqrs.setEstado(estado.toUpperCase());
            if ("CERRADO".equalsIgnoreCase(estado)) {

            pqrs.setFechaCierre(
            new Date()
            ); 
         }
            repo.save(pqrs);

            HistorialPQRS historial = new HistorialPQRS();
            historial.setPqrsId(pqrs.getId());
            historial.setAccion("CAMBIO_ESTADO");
            historial.setEstadoAnterior(estadoAnterior);
            historial.setEstadoNuevo(estado.toUpperCase());
            historial.setFecha(new Date());
            historial.setResponsable(responsable != null ? responsable : "Admin Sistema");
            historial.setComentarioInterno("El estado fue actualizado a " + estado.toUpperCase());
            historial.setMensajeCliente("Tu PQRS ahora está en estado: " + estado.toUpperCase());
            historial.setVisibleCliente(true);
            historial.setDetalle(estadoAnterior + " → " + estado.toUpperCase());
            historialRepo.save(historial);

            return ResponseEntity.ok(pqrs);

        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("mensaje", "Error al cambiar estado");
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    //////////////////////////////////////////////////////
    // ASIGNAR AGENTE
    //////////////////////////////////////////////////////
    @PutMapping("/{id}/asignar")
    public ResponseEntity<?> asignarAgente(@PathVariable String id, @RequestBody Map<String, String> body) {
        try {
            Optional<Pqrs> pqrsOpt = repo.findById(id);
            if (pqrsOpt.isEmpty()) return ResponseEntity.status(404).body("PQRS no encontrada");

            String agente = body.get("agente");
            String responsable = body.get("responsable");

            Pqrs pqrs = pqrsOpt.get();
            pqrs.setAgenteAsignado(agente);
            repo.save(pqrs);

            HistorialPQRS historial = new HistorialPQRS();
            historial.setPqrsId(pqrs.getId());
            historial.setAccion("ASIGNACION");
            historial.setEstadoAnterior(pqrs.getEstado());
            historial.setEstadoNuevo(pqrs.getEstado());
            historial.setFecha(new Date());
            historial.setResponsable(responsable != null ? responsable : "ADMIN");
            historial.setComentarioInterno("PQRS asignada a " + agente);
            historial.setMensajeCliente("Tu solicitud fue asignada a un agente.");
            historial.setVisibleCliente(true);
            historial.setDetalle("Asignado a: " + agente);
            historialRepo.save(historial);

            return ResponseEntity.ok(pqrs);

        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("mensaje", "Error al asignar agente");
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    //////////////////////////////////////////////////////
    // NUEVO ENDPOINT - GESTIÓN COMPLETA
    //////////////////////////////////////////////////////
    @PutMapping("/{id}/gestion-completa")
    public ResponseEntity<?> gestionCompleta(@PathVariable String id, @RequestBody Map<String, String> body) {
        try {
            Optional<Pqrs> pqrsOpt = repo.findById(id);
            if (pqrsOpt.isEmpty()) {
                return ResponseEntity.status(404).body("PQRS no encontrada");
            }

            Pqrs pqrs = pqrsOpt.get();
            String estadoAnterior = pqrs.getEstado();
            String agenteAnterior = pqrs.getAgenteAsignado();

            // El responsable se obtiene de la sesión autenticada y no del dato enviado por el navegador.
            Usuario administrador = obtenerUsuarioAutenticado();
            String responsable = administrador != null
                    && administrador.getUsername() != null
                    && !administrador.getUsername().trim().isEmpty()
                    ? administrador.getUsername().trim()
                    : "ADMIN";

            String estadoSolicitado = body.get("estado");
            String estadoNuevo = estadoAnterior;
            if (estadoSolicitado != null && !estadoSolicitado.trim().isEmpty()) {
                estadoNuevo = estadoSolicitado.trim().toUpperCase();
                boolean estadoValido = "PENDIENTE".equals(estadoNuevo)
                        || "PROCESO".equals(estadoNuevo)
                        || "RESUELTO".equals(estadoNuevo)
                        || "CERRADO".equals(estadoNuevo);

                if (!estadoValido) {
                    return ResponseEntity.badRequest().body("El estado indicado no es válido.");
                }
            }

            boolean cambioEstado = !Objects.equals(
                    estadoAnterior == null ? null : estadoAnterior.trim().toUpperCase(),
                    estadoNuevo == null ? null : estadoNuevo.trim().toUpperCase()
            );

            // Si el campo agente viene vacío, se interpreta como retirar la asignación.
            boolean agenteIncluido = body.containsKey("agente");
            String agenteNuevo = agenteAnterior;
            if (agenteIncluido) {
                String agenteSolicitado = body.get("agente");
                agenteNuevo = agenteSolicitado == null || agenteSolicitado.trim().isEmpty()
                        ? null
                        : agenteSolicitado.trim();
            }

            boolean cambioAgente = !Objects.equals(
                    agenteAnterior == null || agenteAnterior.trim().isEmpty() ? null : agenteAnterior.trim(),
                    agenteNuevo == null || agenteNuevo.trim().isEmpty() ? null : agenteNuevo.trim()
            );

            String comentarioInterno = body.get("comentario");
            comentarioInterno = comentarioInterno == null ? "" : comentarioInterno.trim();

            String mensajeCliente = body.get("mensajeCliente");
            if (mensajeCliente == null) {
                mensajeCliente = body.get("mensaje");
            }
            mensajeCliente = mensajeCliente == null ? "" : mensajeCliente.trim();

            boolean hayGestion = cambioEstado || cambioAgente
                    || !comentarioInterno.isEmpty() || !mensajeCliente.isEmpty();
            if (!hayGestion) {
                return ResponseEntity.badRequest().body("No hay cambios ni información para registrar.");
            }

            if (cambioEstado) {
                pqrs.setEstado(estadoNuevo);
            }
            if (cambioAgente) {
                pqrs.setAgenteAsignado(agenteNuevo);
            }

            // La comunicación también se conserva en la lista de respuestas de la PQRS,
            // igual que ocurría con el endpoint anterior de responder.
            if (!mensajeCliente.isEmpty()) {
                String nombreResponsable = administrador != null
                        && administrador.getNombre() != null
                        && !administrador.getNombre().trim().isEmpty()
                        ? administrador.getNombre().trim()
                        : responsable;

                Respuesta respuesta = new Respuesta();
                respuesta.setMensaje(mensajeCliente);
                respuesta.setAutor(nombreResponsable);
                respuesta.setRol(administrador != null ? administrador.getRole() : "ADMIN");
                respuesta.setFecha(new Date());

                if (pqrs.getRespuestas() == null) {
                    pqrs.setRespuestas(new ArrayList<>());
                }
                pqrs.getRespuestas().add(respuesta);

                if (pqrs.getFechaPrimeraRespuesta() == null) {
                    pqrs.setFechaPrimeraRespuesta(new Date());
                }
            }

            // Guardar los datos de la PQRS una sola vez.
            if (cambioEstado || cambioAgente || !mensajeCliente.isEmpty()) {
                repo.save(pqrs);
            }

            // Un solo documento de historial representa toda la acción de Guardar gestión.
            // Los campos públicos y privados conviven en el registro, pero el endpoint
            // del ciudadano devuelve una proyección que excluye comentarioInterno.
            HistorialPQRS historial = new HistorialPQRS();
            historial.setPqrsId(pqrs.getId());
            historial.setAccion("GESTION_COMPLETA");
            historial.setEstadoAnterior(cambioEstado ? estadoAnterior : null);
            historial.setEstadoNuevo(pqrs.getEstado());
            historial.setFecha(new Date());
            historial.setResponsable(responsable);
            historial.setMensajeCliente(mensajeCliente.isEmpty() ? null : mensajeCliente);
            historial.setComentarioInterno(comentarioInterno.isEmpty() ? null : comentarioInterno);
            historial.setVisibleCliente(cambioEstado || cambioAgente || !mensajeCliente.isEmpty());

            List<String> detallesGestion = new ArrayList<>();
            if (cambioEstado) {
                detallesGestion.add("Estado: "
                        + (estadoAnterior == null ? "Sin estado" : estadoAnterior)
                        + " → " + estadoNuevo);
            }
            if (cambioAgente) {
                detallesGestion.add("Agente: "
                        + (agenteAnterior == null || agenteAnterior.trim().isEmpty() ? "Sin asignar" : agenteAnterior)
                        + " → "
                        + (agenteNuevo == null ? "Sin asignar" : agenteNuevo));
            }
            if (detallesGestion.isEmpty() && !mensajeCliente.isEmpty()) {
                detallesGestion.add("Se registró una comunicación al ciudadano.");
            }
            if (detallesGestion.isEmpty() && !comentarioInterno.isEmpty()) {
                detallesGestion.add("Se agregó una nota administrativa.");
            }
            historial.setDetalle(String.join(" · ", detallesGestion));
            historialRepo.save(historial);

            return ResponseEntity.ok(pqrs);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("mensaje", "Error al guardar gestión completa");
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    private String obtenerMensajeEstadoCliente(String estado) {
        if (estado == null) {
            return "El estado de tu solicitud fue actualizado por el equipo administrativo.";
        }

        switch (estado.toUpperCase()) {
            case "PENDIENTE":
                return "Tu solicitud quedó pendiente de revisión.";
            case "PROCESO":
                return "Tu solicitud está en trámite.";
            case "RESUELTO":
                return "Tu solicitud ha sido marcada como resuelta por el equipo administrativo.";
            case "CERRADO":
                return "Tu solicitud ha sido cerrada por el equipo administrativo.";
            default:
                return "El estado de tu solicitud fue actualizado por el equipo administrativo.";
        }
    }

    //////////////////////////////////////////////////////
   // HISTORIAL USER
  //////////////////////////////////////////////////////
    @GetMapping("/{id}/historial")
   public ResponseEntity<?> obtenerHistorialUsuario(@PathVariable String id) {

    Optional<Pqrs> pqrsOpt = repo.findById(id);

    if (pqrsOpt.isEmpty()) {
        return ResponseEntity.status(404)
                .body("PQRS no encontrada");
    }

    Pqrs pqrs = pqrsOpt.get();

    // El USER solo puede consultar el historial
    // de una PQRS que le pertenece
    if (!esPropietario(pqrs.getUsuarioId())) {
        return ResponseEntity.status(403)
                .body("No tienes permiso para consultar el historial de esta PQRS");
     }

     List<HistorialPQRS> historialVisible =
            historialRepo.findByPqrsIdAndVisibleClienteTrueOrderByFechaAsc(id);

     // Proyectar solo los campos públicos. Una gestión puede contener una nota
     // interna junto con información visible, y esa nota no debe salir al USER.
     List<Map<String, Object>> historialPublico = new ArrayList<>();
     for (HistorialPQRS movimiento : historialVisible) {
         Map<String, Object> item = new HashMap<>();
         item.put("accion", movimiento.getAccion());
         item.put("estadoAnterior", movimiento.getEstadoAnterior());
         item.put("estadoNuevo", movimiento.getEstadoNuevo());
         item.put("fecha", movimiento.getFecha());
         item.put("responsable", movimiento.getResponsable());
         item.put("mensajeCliente", movimiento.getMensajeCliente());
         item.put("detalle", movimiento.getDetalle());
         historialPublico.add(item);
     }

     return ResponseEntity.ok(historialPublico);
   
    }

  //////////////////////////////////////////////////////
  // HISTORIAL ADMIN
  //////////////////////////////////////////////////////
    @GetMapping("/{id}/historial-admin")
    public ResponseEntity<?> obtenerHistorialAdmin(@PathVariable String id) {

    // Verificar que la PQRS exista
    Optional<Pqrs> pqrsOpt = repo.findById(id);

    if (pqrsOpt.isEmpty()) {
        return ResponseEntity.status(404)
                .body("PQRS no encontrada");
    }

    // Solo ADMIN puede consultar el historial administrativo
    if (!esAdmin()) {
        return ResponseEntity.status(403)
                .body("No tienes permiso para consultar el historial administrativo");
    }

    List<HistorialPQRS> historial =
            historialRepo.findByPqrsIdOrderByFechaAsc(id);

    return ResponseEntity.ok(historial);
  }

    //////////////////////////////////////////////////////
    // ESTADISTICAS GLOBALES
    //////////////////////////////////////////////////////
    @GetMapping("/estadisticas-global")
    public ResponseEntity<Map<String, Object>> estadisticasGlobal() {
        List<Pqrs> lista = repo.findAll();
        long total = lista.size();
        long pendientes = lista.stream().filter(p -> "PENDIENTE".equalsIgnoreCase(p.getEstado())).count();
        long proceso = lista.stream().filter(p -> "PROCESO".equalsIgnoreCase(p.getEstado())).count();
        long resueltas = lista.stream().filter(p -> "RESUELTO".equalsIgnoreCase(p.getEstado())).count();
        Map<String, Object> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("pendientes", pendientes);
        stats.put("proceso", proceso);
        stats.put("resueltas", resueltas);
        return ResponseEntity.ok(stats);
    }

   //////////////////////////////////////////////////////
  // DETALLE PQRS
  //////////////////////////////////////////////////////
    @GetMapping("/detalle/{id}")
   public ResponseEntity<?> obtenerPorId(@PathVariable String id) {

    Optional<Pqrs> pqrsOpt = repo.findById(id);

    if (pqrsOpt.isEmpty()) {
        return ResponseEntity.status(404)
                .body("PQRS no encontrada");
    }

    Pqrs pqrs = pqrsOpt.get();

    // ADMIN puede consultar cualquier PQRS
    // USER solo puede consultar sus propias PQRS
    if (!esAdmin() && !esPropietario(pqrs.getUsuarioId())) {
        return ResponseEntity.status(403)
                .body("No tienes permiso para consultar esta PQRS");
    }

    return ResponseEntity.ok(pqrs);
   }

   //////////////////////////////////////////////////////
// VISUALIZAR ARCHIVO ADJUNTO
//////////////////////////////////////////////////////

@GetMapping("/archivo/{nombre}")
public ResponseEntity<?> descargarArchivo(
        @PathVariable String nombre) {

    try {
        Path carpetaUploads = Paths.get(uploadDir)
                .toAbsolutePath()
                .normalize();

        Path ruta = carpetaUploads
                .resolve(nombre)
                .normalize();

        // Evitar que la ruta salga de la carpeta uploads
        if (!ruta.startsWith(carpetaUploads)) {
            return ResponseEntity.badRequest()
                    .body("Ruta de archivo no válida");
        }

        if (!Files.isRegularFile(ruta)) {
            return ResponseEntity.notFound().build();
        }

        byte[] contenido = Files.readAllBytes(ruta);

        // Detectar el formato real, aunque el archivo
        // esté guardado con un nombre UUID sin extensión.
        String tipoContenido =
                detectarTipoContenido(ruta, contenido);

        String nombreDescarga = ruta.getFileName().toString();
        String extension = extensionPorMime(tipoContenido);

        if (!nombreDescarga.contains(".")
                && !extension.isEmpty()) {
            nombreDescarga += extension;
        }

        return ResponseEntity.ok()
                .contentType(
                        org.springframework.http.MediaType
                                .parseMediaType(tipoContenido))
                .contentLength(contenido.length)
                .header(
                        org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                        org.springframework.http.ContentDisposition
                                .inline()
                                .filename(
                                        nombreDescarga,
                                        java.nio.charset.StandardCharsets.UTF_8)
                                .build()
                                .toString())
                .body(contenido);

    } catch (Exception e) {
        e.printStackTrace();

        return ResponseEntity.internalServerError()
                .body("No se pudo visualizar el archivo");
    }
}

private String detectarTipoContenido(
        Path ruta,
        byte[] contenido) throws java.io.IOException {

    // PDF: %PDF-
    if (contenido.length >= 5
            && contenido[0] == '%'
            && contenido[1] == 'P'
            && contenido[2] == 'D'
            && contenido[3] == 'F'
            && contenido[4] == '-') {
        return "application/pdf";
    }

    // PNG
    if (contenido.length >= 8
            && (contenido[0] & 0xFF) == 0x89
            && contenido[1] == 0x50
            && contenido[2] == 0x4E
            && contenido[3] == 0x47
            && contenido[4] == 0x0D
            && contenido[5] == 0x0A
            && contenido[6] == 0x1A
            && contenido[7] == 0x0A) {
        return "image/png";
    }

    // JPEG
    if (contenido.length >= 3
            && (contenido[0] & 0xFF) == 0xFF
            && (contenido[1] & 0xFF) == 0xD8
            && (contenido[2] & 0xFF) == 0xFF) {
        return "image/jpeg";
    }

    // GIF
    if (contenido.length >= 6) {
        String firma = new String(
                contenido, 0, 6,
                java.nio.charset.StandardCharsets.US_ASCII);

        if (firma.equals("GIF87a")
                || firma.equals("GIF89a")) {
            return "image/gif";
        }
    }

    // WEBP
    if (contenido.length >= 12
            && new String(contenido, 0, 4,
                    java.nio.charset.StandardCharsets.US_ASCII)
                    .equals("RIFF")
            && new String(contenido, 8, 4,
                    java.nio.charset.StandardCharsets.US_ASCII)
                    .equals("WEBP")) {
        return "image/webp";
    }

    // Otros formatos que Java pueda reconocer
    String tipo = java.nio.file.Files.probeContentType(ruta);

    return tipo != null
            ? tipo
            : "application/octet-stream";
}


private String extensionPorMime(String tipo) {

    switch (tipo) {
        case "application/pdf":
            return ".pdf";

        case "image/png":
            return ".png";

        case "image/jpeg":
            return ".jpg";

        case "image/gif":
            return ".gif";

        case "image/webp":
            return ".webp";

        default:
            return "";
    }
}


    @GetMapping("/dashboard")
    public ResponseEntity<?> dashboard() {

    Map<String, Object> datos =
            new HashMap<>();

    datos.put(
            "total",
            repo.count()
    );

    datos.put(
            "pendientes",
            repo.countByEstado(
                    "PENDIENTE"
            )
    );

    datos.put(
            "proceso",
            repo.countByEstado(
                    "PROCESO"
            )
    );

    datos.put(
            "resueltos",
            repo.countByEstado(
                    "RESUELTO"
            )
    );

    datos.put(
            "cerrados",
            repo.countByEstado(
                    "CERRADO"
            )
    );

    datos.put(
            "alta",
            repo.countByPrioridad(
                    "ALTA"
            )
    );

    datos.put(
            "media",
            repo.countByPrioridad(
                    "MEDIA"
            )
    );

    datos.put(
            "baja",
            repo.countByPrioridad(
                    "BAJA"
            )
    );

    return ResponseEntity.ok(
            datos
    );
}


}