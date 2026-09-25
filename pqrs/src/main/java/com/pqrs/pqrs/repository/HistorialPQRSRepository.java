package com.pqrs.pqrs.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.pqrs.pqrs.model.HistorialPQRS;

@Repository
public interface HistorialPQRSRepository
        extends MongoRepository<HistorialPQRS, String> {

    //////////////////////////////////////////////////////
    // HISTORIAL COMPLETO POR PQRS
    //////////////////////////////////////////////////////

    List<HistorialPQRS> findByPqrsId(
            String pqrsId
    );

    //////////////////////////////////////////////////////
    // HISTORIAL CLIENTE
    // SOLO EVENTOS VISIBLES
    //////////////////////////////////////////////////////

    List<HistorialPQRS>
    findByPqrsIdAndVisibleClienteTrue(
            String pqrsId
    );

    //////////////////////////////////////////////////////
    // HISTORIAL ADMIN ORDENADO
    //////////////////////////////////////////////////////

    List<HistorialPQRS>
    findByPqrsIdOrderByFechaAsc(
            String pqrsId
    );

    //////////////////////////////////////////////////////
    // HISTORIAL CLIENTE ORDENADO
    //////////////////////////////////////////////////////

    List<HistorialPQRS>
    findByPqrsIdAndVisibleClienteTrueOrderByFechaAsc(
            String pqrsId
    );

    //////////////////////////////////////////////////////
    // HISTORIAL POR ESTADO
    //////////////////////////////////////////////////////

    List<HistorialPQRS>
    findByEstadoNuevo(
            String estadoNuevo
    );

    //////////////////////////////////////////////////////
    // HISTORIAL POR RESPONSABLE
    //////////////////////////////////////////////////////

    List<HistorialPQRS>
    findByResponsable(
            String responsable
    );
}