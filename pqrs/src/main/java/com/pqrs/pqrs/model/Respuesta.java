package com.pqrs.pqrs.model;

import java.util.Date;

public class Respuesta {

    //////////////////////////////////////////////////////
    // MENSAJE
    //////////////////////////////////////////////////////

    private String mensaje;

    //////////////////////////////////////////////////////
    // AUTOR
    //////////////////////////////////////////////////////

    /*
        Ejemplos:
        - Admin Laura
        - Juan Pérez
        - Carlos Mendoza
    */

    private String autor;

    //////////////////////////////////////////////////////
    // ROL
    //////////////////////////////////////////////////////

    /*
        ADMIN
        CLIENTE
        AGENTE
    */

    private String rol;

    //////////////////////////////////////////////////////
    // FECHA
    //////////////////////////////////////////////////////

    private Date fecha;

    //////////////////////////////////////////////////////
    // GETTERS & SETTERS
    //////////////////////////////////////////////////////

    public String getMensaje() {

        return mensaje;
    }

    public void setMensaje(String mensaje) {

        this.mensaje = mensaje;
    }

    public String getAutor() {

        return autor;
    }

    public void setAutor(String autor) {

        this.autor = autor;
    }

    public String getRol() {

        return rol;
    }

    public void setRol(String rol) {

        this.rol = rol;
    }

    public Date getFecha() {

        return fecha;
    }

    public void setFecha(Date fecha) {

        this.fecha = fecha;
    }

    //////////////////////////////////////////////////////
    // TO STRING
    //////////////////////////////////////////////////////

    @Override
    public String toString() {

        return "Respuesta{" +
                "mensaje='" + mensaje + '\'' +
                ", autor='" + autor + '\'' +
                ", rol='" + rol + '\'' +
                ", fecha=" + fecha +
                '}';
    }
}