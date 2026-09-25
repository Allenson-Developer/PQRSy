package com.pqrs.pqrs.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.pqrs.pqrs.model.Pqrs;

@Repository
public interface PqrsRepository
        extends MongoRepository<Pqrs, String> {

    //////////////////////////////////////////////////////
    // LISTAR PQRS POR USUARIO
    //////////////////////////////////////////////////////

    List<Pqrs> findByUsuarioId(
            String usuarioId
    );

    //////////////////////////////////////////////////////
    // FILTRAR POR USUARIO Y ESTADO
    //////////////////////////////////////////////////////

    List<Pqrs> findByUsuarioIdAndEstado(

            String usuarioId,

            String estado
    );

    //////////////////////////////////////////////////////
    // FILTRAR GLOBAL POR ESTADO
    //////////////////////////////////////////////////////

    List<Pqrs> findByEstado(
            String estado
    );

    //////////////////////////////////////////////////////
    // FILTRAR POR AGENTE
    //////////////////////////////////////////////////////

    List<Pqrs> findByAgenteAsignado(
            String agenteAsignado
    );

    //////////////////////////////////////////////////////
    // BUSCAR POR TIPO
    //////////////////////////////////////////////////////

    List<Pqrs> findByTipo(
            String tipo
    );

    //////////////////////////////////////////////////////
    // BUSCAR POR USERNAME
    //////////////////////////////////////////////////////

    List<Pqrs> findByUsername(
            String username
    );

    //////////////////////////////////////////////////////
    // HISTORIAL / DASHBOARD
    //////////////////////////////////////////////////////

    long countByEstado(
            String estado
    );

    long countByUsuarioId(
            String usuarioId
    );

    long countByUsuarioIdAndEstado(

            String usuarioId,

            String estado
    );

    //////////////////////////////////////////////////////
    // PANEL ADMIN
    //////////////////////////////////////////////////////

    List<Pqrs> findByEstadoOrderByFechaDesc(
            String estado
    );

    List<Pqrs> findAllByOrderByFechaDesc();

    //////////////////////////////////////////////////////
    // BUSQUEDA GENERAL
    //////////////////////////////////////////////////////

    List<Pqrs> findByDescripcionContainingIgnoreCase(
            String descripcion
    );

    List<Pqrs> findByNombreContainingIgnoreCase(
            String nombre
    );

    List<Pqrs> findByPrioridad(
        String prioridad
  );

   List<Pqrs> findByEstadoAndPrioridad(
        String estado,
        String prioridad
  );
  long countByPrioridad(
        String prioridad
  );

}