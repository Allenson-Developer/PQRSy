package com.pqrs.pqrs.model;

import java.util.Date;

/**
 * Mensaje de conversación entre el ciudadano y la administración.
 * Se mantiene separado de Respuesta para no mezclar el chat con
 * las comunicaciones oficiales del trámite.
 */
public class MensajeConversacion {

    private String mensaje;
    private String autor;
    private String rol;
    private Date fecha;

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
}
