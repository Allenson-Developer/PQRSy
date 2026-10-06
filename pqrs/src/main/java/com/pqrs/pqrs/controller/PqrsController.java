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

import org.springframework.beans.factory.annotation.Autowired;
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
            Pqrs pqrs = new Pqrs();
            pqrs.setTipo(tipo);
            pqrs.setDescripcion(descripcion);
            pqrs.setUsuarioId(usuarioId);
            pqrs.setFecha(new Date());
            pqrs.setEstado("PENDIENTE");
            pqrs.setPrioridad("MEDIA");

            Optional<Usuario> userOpt = usuarioRepo.findById(usuarioId);
            if (userOpt.isPresent()) {
                Usuario user = userOpt.get();
                pqrs.setUsername(user.getUsername());
                pqrs.setNombre(user.getNombre());
            }

            if (archivo != null && !archivo.isEmpty()) {
                String carpeta = "uploads/";
                File directorio = new File(carpeta);
                if (!directorio.exists()) {
                    directorio.mkdirs();
                }
                String nombreArchivo = System.currentTimeMillis() + "_" + archivo.getOriginalFilename();
                Path ruta = Paths.get(carpeta + nombreArchivo);
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
            historial.setResponsable(userOpt.isPresent() ? userOpt.get().getNombre() : "Usuario");
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
        try {
            Optional<Pqrs> pqrsOpt = repo.findById(id);
            if (pqrsOpt.isEmpty()) return ResponseEntity.status(404).body("PQRS no encontrada");

            String mensaje = body.get("respuesta");
            String autor = body.get("autor");
            if (mensaje == null || mensaje.trim().isEmpty())
                return ResponseEntity.badRequest().body("La respuesta no puede estar vacía");

            Pqrs pqrs = pqrsOpt.get();

            Respuesta r = new Respuesta();
            r.setMensaje(mensaje);
            r.setAutor(autor != null ? autor : "ADMIN");
            r.setRol(body.get("rol") != null ? body.get("rol") : "ADMIN");
            r.setFecha(new Date());

            if (pqrs.getRespuestas() == null) pqrs.setRespuestas(new ArrayList<>());
            pqrs.getRespuestas().add(r);

         //////////////////////////////////////////////////////
         // PRIMERA RESPUESTA
         //////////////////////////////////////////////////////

           if (pqrs.getFechaPrimeraRespuesta() == null) {

            pqrs.setFechaPrimeraRespuesta(
            new Date()
           );
          }
            repo.save(pqrs);

            HistorialPQRS historial = new HistorialPQRS();
            historial.setPqrsId(pqrs.getId());
            historial.setAccion("RESPUESTA");
            historial.setEstadoAnterior(pqrs.getEstado());
            historial.setEstadoNuevo(pqrs.getEstado());
            historial.setFecha(new Date());
            historial.setResponsable(autor != null ? autor : "ADMIN");
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
            if (pqrsOpt.isEmpty()) return ResponseEntity.status(404).body("PQRS no encontrada");

            Pqrs pqrs = pqrsOpt.get();
            String agente = body.get("agente");
            String estado = body.get("estado");
            String comentario = body.get("comentario");
            String responsable = body.get("responsable");

            if (agente != null && !agente.isEmpty()) pqrs.setAgenteAsignado(agente);

            String estadoAnterior = pqrs.getEstado();
            if (estado != null && !estado.isEmpty() && !estadoAnterior.equalsIgnoreCase(estado)) {
                pqrs.setEstado(estado.toUpperCase());
            }

            repo.save(pqrs);

            HistorialPQRS historial = new HistorialPQRS();
            historial.setPqrsId(pqrs.getId());
            historial.setAccion("GESTION_COMPLETA");
            historial.setEstadoAnterior(estadoAnterior);
            historial.setEstadoNuevo(pqrs.getEstado());
            historial.setFecha(new Date());
            historial.setResponsable(responsable != null ? responsable : "ADMIN");
            historial.setComentarioInterno(comentario != null ? comentario : "");
            historial.setVisibleCliente(false);
            historialRepo.save(historial);

            return ResponseEntity.ok(pqrs);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("mensaje", "Error al guardar gestión completa");
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
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

     return ResponseEntity.ok(historialVisible);
   
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
    // DESCARGAR ARCHIVO
    //////////////////////////////////////////////////////
    @GetMapping("/archivo/{nombre}")
    public ResponseEntity<?> descargarArchivo(@PathVariable String nombre) {
        try {
            Path ruta = Paths.get("uploads/").resolve(nombre).normalize();
            File archivo = ruta.toFile();
            if (!archivo.exists()) return ResponseEntity.status(404).body("Archivo no encontrado");
            byte[] contenido = Files.readAllBytes(ruta);
            return ResponseEntity.ok()
                    .header("Content-Disposition", "inline; filename=\"" + archivo.getName() + "\"")
                    .body(contenido);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("mensaje", "Error al descargar archivo");
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
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