package com.pqrs.pqrs.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.pqrs.pqrs.model.Usuario;

@Repository
public interface UsuarioRepository
        extends MongoRepository<Usuario, String> {

   //////////////////////////////////////////////////////
// LOGIN POR USERNAME
//////////////////////////////////////////////////////

Optional<Usuario> findByUsername(
        String username
);

Optional<Usuario> findByUsernameAndEstado(
        String username,
        String estado
);

    //////////////////////////////////////////////////////
    // LOGIN ADMIN CON DOCUMENTO
    //////////////////////////////////////////////////////

    Optional<Usuario> findByUsernameAndDocumento(

            String username,

            String documento
    );

    //////////////////////////////////////////////////////
    // BUSCAR POR DOCUMENTO
    //////////////////////////////////////////////////////

    Optional<Usuario> findByDocumento(
            String documento
    );

    //////////////////////////////////////////////////////
    // LISTAR POR ROL
    //////////////////////////////////////////////////////

    List<Usuario> findByRole(
            String role
    );

    //////////////////////////////////////////////////////
    // LISTAR POR ESTADO
    //////////////////////////////////////////////////////

    List<Usuario> findByEstado(
            String estado
    );

    //////////////////////////////////////////////////////
    // VALIDACIONES
    //////////////////////////////////////////////////////

    boolean existsByUsername(
            String username
    );

    boolean existsByDocumento(
            String documento
    );

    //////////////////////////////////////////////////////
    // BUSQUEDAS ADMIN
    //////////////////////////////////////////////////////

    List<Usuario> findByNombreContainingIgnoreCase(
            String nombre
    );

    List<Usuario> findByApellidoContainingIgnoreCase(
            String apellido
    );

    List<Usuario> findByUsernameContainingIgnoreCase(
            String username
    );

    //////////////////////////////////////////////////////
    // FILTRO COMBINADO
    //////////////////////////////////////////////////////

    List<Usuario> findByRoleAndEstado(

            String role,

            String estado
    );
}