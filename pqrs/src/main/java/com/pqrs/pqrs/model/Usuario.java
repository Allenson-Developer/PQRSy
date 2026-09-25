package com.pqrs.pqrs.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.data.mongodb.core.index.Indexed;

@Document(collection = "usuarios")
public class Usuario {

    //////////////////////////////////////////////////////
    // ID
    //////////////////////////////////////////////////////

    @Id
    private String id;

    //////////////////////////////////////////////////////
    // DATOS PERSONALES
    //////////////////////////////////////////////////////

    private String nombre;

    private String apellido;

    @Indexed(unique = true)
    private String documento;

    //////////////////////////////////////////////////////
    // LOGIN
    //////////////////////////////////////////////////////
 
    @Indexed(unique = true)
    private String username;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    //////////////////////////////////////////////////////
    // ROL
    //////////////////////////////////////////////////////

    /*
        ADMIN
        USER
        AGENTE
    */

    private String role;

    //////////////////////////////////////////////////////
    // ESTADO
    //////////////////////////////////////////////////////

    /*
        ACTIVO
        INACTIVO
    */

    private String estado;

    //////////////////////////////////////////////////////
    // GETTERS & SETTERS
    //////////////////////////////////////////////////////

    public String getId() {

        return id;
    }

    public void setId(String id) {

        this.id = id;
    }

    public String getNombre() {

        return nombre;
    }

    public void setNombre(String nombre) {

        this.nombre = nombre;
    }

    public String getApellido() {

        return apellido;
    }

    public void setApellido(String apellido) {

        this.apellido = apellido;
    }

    public String getDocumento() {

        return documento;
    }

    public void setDocumento(String documento) {

        this.documento = documento;
    }

    public String getUsername() {

        return username;
    }

    public void setUsername(String username) {

        this.username = username;
    }

    public String getPassword() {

        return password;
    }

    public void setPassword(String password) {

        this.password = password;
    }

    public String getRole() {

        return role;
    }

    public void setRole(String role) {

        this.role = role;
    }

    public String getEstado() {

        return estado;
    }

    public void setEstado(String estado) {

        this.estado = estado;
    }

    //////////////////////////////////////////////////////
    // NOMBRE COMPLETO
    //////////////////////////////////////////////////////

    public String getNombreCompleto() {

        return nombre + " " + apellido;
    }

    //////////////////////////////////////////////////////
    // TO STRING
    //////////////////////////////////////////////////////

    @Override
    public String toString() {

        return "Usuario{" +
                "id='" + id + '\'' +
                ", nombre='" + nombre + '\'' +
                ", apellido='" + apellido + '\'' +
                ", documento='" + documento + '\'' +
                ", username='" + username + '\'' +
                ", role='" + role + '\'' +
                ", estado='" + estado + '\'' +
                '}';
    }
}