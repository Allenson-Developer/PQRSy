package com.pqrs.pqrs.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.springframework.mail.MailException;
import com.pqrs.pqrs.service.EmailService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
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

import com.pqrs.pqrs.dto.LoginRequest;
import com.pqrs.pqrs.dto.LoginResponse;
import com.pqrs.pqrs.model.Usuario;
import com.pqrs.pqrs.repository.UsuarioRepository;
import com.pqrs.pqrs.security.JwtService;


@RestController
@RequestMapping("/test")
@CrossOrigin(origins = "*")
public class UsuarioController {

    @Autowired
    private UsuarioRepository repo;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private EmailService emailService;

    private final PasswordEncoder passwordEncoder =
            new BCryptPasswordEncoder();

    //////////////////////////////////////////////////////
     // REGISTER
  //////////////////////////////////////////////////////

  @PostMapping("/register")
  public ResponseEntity<?> crear(@RequestBody Usuario user) {

    try {

        // VALIDAR NOMBRE
        if (user.getNombre() == null ||
                user.getNombre().isBlank()) {

            return ResponseEntity.badRequest()
                    .body("El nombre es obligatorio");
        }

        user.setNombre(user.getNombre().trim());

        // VALIDAR USERNAME
        if (user.getUsername() == null ||
                user.getUsername().isBlank()) {

            return ResponseEntity.badRequest()
                    .body("El username es obligatorio");
        }

        String username = user.getUsername().trim();
        user.setUsername(username);

        if (repo.existsByUsername(username)) {
            return ResponseEntity.status(409)
                    .body("El username ya está registrado");
        }

        // VALIDAR CORREO
        if (user.getEmail() == null ||
                user.getEmail().isBlank()) {

            return ResponseEntity.badRequest()
                    .body("El correo electrónico es obligatorio");
        }

        String email = user.getEmail()
                .trim()
                .toLowerCase(Locale.ROOT);

        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            return ResponseEntity.badRequest()
                    .body("El formato del correo electrónico no es válido");
        }

        user.setEmail(email);

        if (repo.existsByEmail(email)) {
            return ResponseEntity.status(409)
                    .body("El correo electrónico ya está registrado");
        }

        // VALIDAR CONTRASEÑA
        if (user.getPassword() == null ||
                user.getPassword().isBlank()) {

            return ResponseEntity.badRequest()
                    .body("La contraseña es obligatoria");
        }

        // SEGURIDAD: EL REGISTRO PÚBLICO SIEMPRE CREA USER
        user.setRole("USER");
        user.setEstado("ACTIVO");

        // ENCRIPTAR CONTRASEÑA
        user.setPassword(
                passwordEncoder.encode(user.getPassword())
        );

        // GUARDAR USUARIO
        Usuario nuevo = repo.save(user);

        return ResponseEntity.ok(nuevo);

    } catch (DuplicateKeyException e) {

        return ResponseEntity.status(409)
                .body("El username o correo electrónico ya está registrado");

    } catch (Exception e) {

        Map<String, Object> response = new HashMap<>();

        response.put(
                "mensaje",
                "Error al registrar usuario"
        );

        // No exponer detalles internos del servidor al cliente.
        return ResponseEntity.status(500).body(response);
    }
 }

    //////////////////////////////////////////////////////
    // LOGIN
    //////////////////////////////////////////////////////

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request
    ) {

        try {

            //////////////////////////////////////////////////
            // VALIDAR INPUTS
            //////////////////////////////////////////////////

            if (request.getUsername() == null ||
                    request.getPassword() == null) {

                return ResponseEntity
                        .badRequest()
                        .body("Datos incompletos");
            }

            String username =
                    request.getUsername().trim();

            String password =
                    request.getPassword().trim();

            String documento =
                    request.getDocumento() != null
                            ? request.getDocumento().trim()
                            : "";

            //////////////////////////////////////////////////
            // DEBUG LOGIN
            //////////////////////////////////////////////////

            Optional<Usuario> userOpt;

            //////////////////////////////////////////////////
            // LOGIN ADMIN
            //////////////////////////////////////////////////

            if (!documento.isEmpty()) {

                userOpt =
                        repo.findByUsernameAndDocumento(
                                username,
                                documento
                        );


                  if (userOpt.isEmpty()) {

                    return ResponseEntity
                            .status(403)
                            .body("Datos de administrador incorrectos");
                }

            } else {

                //////////////////////////////////////////////////
                // LOGIN USER NORMAL
                //////////////////////////////////////////////////

                userOpt =
                        repo.findByUsername(username);


                if (userOpt.isEmpty()) {

                    return ResponseEntity
                            .status(404)
                            .body("Usuario no encontrado");
                }
            }

            Usuario user =
                    userOpt.get();

            //////////////////////////////////////////////////
            // VALIDAR ESTADO
            //////////////////////////////////////////////////

            if (user.getEstado() != null &&
                    user.getEstado().equalsIgnoreCase("INACTIVO")) {

                return ResponseEntity
                        .status(403)
                        .body("Usuario inactivo");
            }

            //////////////////////////////////////////////////
            // DEBUG PASSWORD
            //////////////////////////////////////////////////
            /// 
            boolean passwordCorrecta =
                    passwordEncoder.matches(
                            password,
                            user.getPassword()
                    );

          

            //////////////////////////////////////////////////
            // VALIDAR PASSWORD
            //////////////////////////////////////////////////

            if (!passwordCorrecta) {

                return ResponseEntity
                        .status(401)
                        .body("Contraseña incorrecta");
            }

            //////////////////////////////////////////////////
            // LOGIN EXITOSO
            //////////////////////////////////////////////////

         String token =
         jwtService.generarToken(user);

         LoginResponse response =
         new LoginResponse();

         response.setId(
          user.getId()
         );

         response.setUsername(
         user.getUsername()
         );

         response.setNombre(
         user.getNombre()
         );

         response.setRole(
         user.getRole()
          );

         response.setEstado(
         user.getEstado()
         );
         
         response.setToken(token);

         return ResponseEntity.ok(response);
      

        } catch (Exception e) {

            e.printStackTrace();

            Map<String, Object> response =
                    new HashMap<>();

            response.put(
                    "mensaje",
                    "Error interno servidor"
            );

            response.put(
                    "error",
                    e.getMessage()
            );

            return ResponseEntity
                    .status(500)
                    .body(response);
        }
 }

    //////////////////////////////////////////////////////
    // GET ALL
    //////////////////////////////////////////////////////

    @GetMapping("/listar")
    public ResponseEntity<List<Usuario>> listar() {

        return ResponseEntity.ok(
                repo.findAll()
        );
    }

    //////////////////////////////////////////////////////
    // GET BY ID
    //////////////////////////////////////////////////////

    @GetMapping("/{id}")
    public ResponseEntity<?> obtener(
            @PathVariable String id
    ) {

        Optional<Usuario> user =
                repo.findById(id);

        if (user.isPresent()) {

            return ResponseEntity.ok(
                    user.get()
            );

        } else {

            return ResponseEntity
                    .status(404)
                    .body("Usuario no encontrado");
        }
    }

    //////////////////////////////////////////////////////
    // UPDATE
    //////////////////////////////////////////////////////

    @PutMapping("/actualizar/{id}")
    public ResponseEntity<?> actualizar(

            @PathVariable String id,

            @RequestBody Usuario datos

    ) {

        try {

            Optional<Usuario> userOpt =
                    repo.findById(id);

            if (userOpt.isEmpty()) {

                return ResponseEntity
                        .status(404)
                        .body("Usuario no encontrado");
            }

            Usuario user =
                    userOpt.get();

            if (datos.getNombre() != null) {

                user.setNombre(
                        datos.getNombre()
                );
            }

            if (datos.getUsername() != null) {

                user.setUsername(
                        datos.getUsername()
                );
            }

            if (datos.getPassword() != null &&
                    !datos.getPassword().isEmpty()) {

                user.setPassword(
                        passwordEncoder.encode(
                                datos.getPassword()
                        )
                );
            }

            repo.save(user);

            return ResponseEntity.ok(
                    user
            );

        } catch (Exception e) {

            Map<String, Object> response =
                    new HashMap<>();

            response.put(
                    "mensaje",
                    "Error al actualizar usuario"
            );

            response.put(
                    "error",
                    e.getMessage()
            );

            return ResponseEntity
                    .status(500)
                    .body(response);
        }
    }

    //////////////////////////////////////////////////////
    // CAMBIAR ESTADO
    //////////////////////////////////////////////////////

    @PutMapping("/{id}/estado")
    public ResponseEntity<?> cambiarEstado(

            @PathVariable String id,

            @RequestParam String estado

    ) {

        try {

            Optional<Usuario> userOpt =
                    repo.findById(id);

            if (userOpt.isEmpty()) {

                return ResponseEntity
                        .status(404)
                        .body("Usuario no encontrado");
            }

            Usuario user =
                    userOpt.get();

            user.setEstado(
                    estado.toUpperCase()
            );

            repo.save(user);

            return ResponseEntity.ok(
                    user
            );

        } catch (Exception e) {

            Map<String, Object> response =
                    new HashMap<>();

            response.put(
                    "mensaje",
                    "Error al cambiar estado"
            );

            response.put(
                    "error",
                    e.getMessage()
            );

            return ResponseEntity
                    .status(500)
                    .body(response);
        }
    }

    //////////////////////////////////////////////////////
    // DELETE
    //////////////////////////////////////////////////////
        @DeleteMapping("/eliminar/{id}")
        public ResponseEntity<?> eliminar(
        @PathVariable String id
       ) {

    try {

        Authentication auth =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        String username =
                auth.getName();

        Usuario usuarioLogueado =
                repo.findByUsername(username)
                        .orElse(null);

        if (usuarioLogueado == null) {

            return ResponseEntity
                    .status(401)
                    .body("Usuario no autenticado");
        }

        if (!"ADMIN".equals(
                usuarioLogueado.getRole()
        )) {

            return ResponseEntity
                    .status(403)
                    .body("Solo ADMIN puede eliminar usuarios");
        }

        repo.deleteById(id);

        return ResponseEntity.ok(
                "Usuario eliminado"
        );

    } catch (Exception e) {

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "mensaje",
                "Error al eliminar usuario"
        );

        response.put(
                "error",
                e.getMessage()
        );

        return ResponseEntity
                .status(500)
                .body(response);
    }
 }

  //////////////////////////////////////////////////////
 // PRUEBA TEMPORAL DE CORREO
 //////////////////////////////////////////////////////

  @PostMapping("/send-email")
 public ResponseEntity<?> enviarCorreoPrueba() {

    try {

        emailService.enviarCorreoPrueba();

        return ResponseEntity.ok(
                "Correo enviado. Revisa tu bandeja de entrada y spam."
        );

    } catch (MailException e) {

        return ResponseEntity.status(502)
                .body("No se pudo enviar el correo. Revisa la configuración SMTP.");
    }
 }

}