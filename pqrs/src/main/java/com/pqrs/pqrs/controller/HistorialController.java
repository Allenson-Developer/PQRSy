package com.pqrs.pqrs.controller;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pqrs.pqrs.model.HistorialPQRS;
import com.pqrs.pqrs.repository.HistorialPQRSRepository;

@RestController
@RequestMapping("/historial")
@CrossOrigin(origins = "*")
public class HistorialController {

    @Autowired
    private HistorialPQRSRepository historialRepo;

    //////////////////////////////////////////////////////
    // HISTORIAL COMPLETO ADMIN
    //////////////////////////////////////////////////////

    @GetMapping("/admin/pqrs/{pqrsId}")
    public ResponseEntity<?> obtenerHistorialAdmin(

            @PathVariable String pqrsId

    ) {

        try {

            List<HistorialPQRS> historial =

                    historialRepo
                            .findByPqrsIdOrderByFechaAsc(
                                    pqrsId
                            );

            return ResponseEntity.ok(historial);

        } catch (Exception e) {

            Map<String, Object> response =
                    new HashMap<>();

            response.put(
                    "mensaje",
                    "Error al obtener historial administrador"
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
    // HISTORIAL VISIBLE CLIENTE
    //////////////////////////////////////////////////////

    @GetMapping("/cliente/pqrs/{pqrsId}")
    public ResponseEntity<?> obtenerHistorialCliente(

            @PathVariable String pqrsId

    ) {

        try {

            List<HistorialPQRS> historial =

                    historialRepo
                            .findByPqrsIdAndVisibleClienteTrueOrderByFechaAsc(
                                    pqrsId
                            );

            return ResponseEntity.ok(historial);

        } catch (Exception e) {

            Map<String, Object> response =
                    new HashMap<>();

            response.put(
                    "mensaje",
                    "Error al obtener historial cliente"
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
    // AGREGAR NOTA INTERNA ADMIN
    //////////////////////////////////////////////////////

    @PostMapping("/nota/{pqrsId}")
    public ResponseEntity<?> agregarNota(

            @PathVariable String pqrsId,

            @RequestBody Map<String, String> body

    ) {

        try {

            String comentarioInterno =
                    body.get("comentarioInterno");

            String responsable =
                    body.get("responsable");

            if (
                    comentarioInterno == null
                            || comentarioInterno.trim().isEmpty()
            ) {

                Map<String, Object> response =
                        new HashMap<>();

                response.put(
                        "mensaje",
                        "La nota no puede estar vacía"
                );

                return ResponseEntity
                        .badRequest()
                        .body(response);
            }

            //////////////////////////////////////////////////
            // CREAR HISTORIAL
            //////////////////////////////////////////////////

            HistorialPQRS historial =
                    new HistorialPQRS();

            historial.setPqrsId(
                    pqrsId
            );

            historial.setAccion(
                    "NOTA_INTERNA"
            );

            historial.setEstadoAnterior(
                    null
            );

            historial.setEstadoNuevo(
                    null
            );

            historial.setFecha(
                    new Date()
            );

            historial.setResponsable(
                    responsable != null
                            ? responsable
                            : "ADMIN"
            );

            historial.setComentarioInterno(
                    comentarioInterno
            );

            historial.setMensajeCliente(
                    null
            );

            historial.setVisibleCliente(
                    false
            );

            historial.setDetalle(
                    "Se agregó una nota administrativa"
            );

            historialRepo.save(historial);

            Map<String, Object> response =
                    new HashMap<>();

            response.put(
                    "mensaje",
                    "Nota agregada correctamente"
            );

            response.put(
                    "data",
                    historial
            );

            return ResponseEntity.ok(
                    response
            );

        } catch (Exception e) {

            Map<String, Object> response =
                    new HashMap<>();

            response.put(
                    "mensaje",
                    "Error al guardar nota"
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
    // EDITAR COMENTARIO INTERNO
    //////////////////////////////////////////////////////

    @PutMapping("/{id}/comentario")
    public ResponseEntity<?> editarComentario(

            @PathVariable String id,

            @RequestBody Map<String, String> body

    ) {

        try {

            Optional<HistorialPQRS> historialOpt =
                    historialRepo.findById(id);

            if (historialOpt.isEmpty()) {

                Map<String, Object> response =
                        new HashMap<>();

                response.put(
                        "mensaje",
                        "Historial no encontrado"
                );

                return ResponseEntity
                        .status(404)
                        .body(response);
            }

            String comentario =
                    body.get("comentario");

            HistorialPQRS historial =
                    historialOpt.get();

            historial.setComentarioInterno(
                    comentario
            );

            historialRepo.save(historial);

            Map<String, Object> response =
                    new HashMap<>();

            response.put(
                    "mensaje",
                    "Comentario actualizado correctamente"
            );

            response.put(
                    "data",
                    historial
            );

            return ResponseEntity.ok(
                    response
            );

        } catch (Exception e) {

            Map<String, Object> response =
                    new HashMap<>();

            response.put(
                    "mensaje",
                    "Error al actualizar comentario"
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
}