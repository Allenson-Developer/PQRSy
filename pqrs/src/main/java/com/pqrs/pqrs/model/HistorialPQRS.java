package com.pqrs.pqrs.model;

import java.util.Date;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "historial_pqrs")
public class HistorialPQRS {

    //////////////////////////////////////////////////////
    // ID
    //////////////////////////////////////////////////////

    @Id
    private String id;

    //////////////////////////////////////////////////////
    // RELACIÓN PQRS
    //////////////////////////////////////////////////////

    // ID de la PQRS relacionada
    private String pqrsId;

    //////////////////////////////////////////////////////
    // ACCIÓN
    //////////////////////////////////////////////////////

    /*
        CREAR_PQRS
        CAMBIO_ESTADO
        RESPUESTA
        ASIGNACION
        CIERRE
        REAPERTURA
    */

    private String accion;

    //////////////////////////////////////////////////////
    // ESTADOS
    //////////////////////////////////////////////////////

    // Estado anterior
    private String estadoAnterior;

    // Estado nuevo
    private String estadoNuevo;

    //////////////////////////////////////////////////////
    // FECHA EVENTO
    //////////////////////////////////////////////////////

    private Date fecha;

    //////////////////////////////////////////////////////
    // RESPONSABLE
    //////////////////////////////////////////////////////

    // Usuario o administrador responsable
    private String responsable;

    //////////////////////////////////////////////////////
    // COMENTARIOS
    //////////////////////////////////////////////////////

    // Comentario interno SOLO ADMIN
    private String comentarioInterno;

    // Mensaje visible para cliente
    private String mensajeCliente;

    //////////////////////////////////////////////////////
    // VISIBILIDAD
    //////////////////////////////////////////////////////

    // TRUE = visible cliente
    // FALSE = solo admin
    private Boolean visibleCliente;

    //////////////////////////////////////////////////////
    // DETALLE EXTRA
    //////////////////////////////////////////////////////

    private String detalle;

    //////////////////////////////////////////////////////
    // NUEVOS CAMPOS HISTORIAL AVANZADO
    //////////////////////////////////////////////////////

    // Tipo de usuario que realizó la acción
    // ADMIN / CLIENTE / AGENTE
    private String rolResponsable;

    // Archivo relacionado con el evento
    private String archivoAdjunto;

    // IP origen (opcional)
    private String ipOrigen;

    // Observación técnica
    private String observacionTecnica;

    //////////////////////////////////////////////////////
    // GETTERS & SETTERS
    //////////////////////////////////////////////////////

    public String getId() {

        return id;
    }

    public void setId(String id) {

        this.id = id;
    }

    public String getPqrsId() {

        return pqrsId;
    }

    public void setPqrsId(String pqrsId) {

        this.pqrsId = pqrsId;
    }

    public String getAccion() {

        return accion;
    }

    public void setAccion(String accion) {

        this.accion = accion;
    }

    public String getEstadoAnterior() {

        return estadoAnterior;
    }

    public void setEstadoAnterior(String estadoAnterior) {

        this.estadoAnterior = estadoAnterior;
    }

    public String getEstadoNuevo() {

        return estadoNuevo;
    }

    public void setEstadoNuevo(String estadoNuevo) {

        this.estadoNuevo = estadoNuevo;
    }

    public Date getFecha() {

        return fecha;
    }

    public void setFecha(Date fecha) {

        this.fecha = fecha;
    }

    public String getResponsable() {

        return responsable;
    }

    public void setResponsable(String responsable) {

        this.responsable = responsable;
    }

    public String getComentarioInterno() {

        return comentarioInterno;
    }

    public void setComentarioInterno(String comentarioInterno) {

        this.comentarioInterno = comentarioInterno;
    }

    public String getMensajeCliente() {

        return mensajeCliente;
    }

    public void setMensajeCliente(String mensajeCliente) {

        this.mensajeCliente = mensajeCliente;
    }

    public Boolean getVisibleCliente() {

        return visibleCliente;
    }

    public void setVisibleCliente(Boolean visibleCliente) {

        this.visibleCliente = visibleCliente;
    }

    public String getDetalle() {

        return detalle;
    }

    public void setDetalle(String detalle) {

        this.detalle = detalle;
    }

    //////////////////////////////////////////////////////
    // NUEVOS GETTERS & SETTERS
    //////////////////////////////////////////////////////

    public String getRolResponsable() {

        return rolResponsable;
    }

    public void setRolResponsable(String rolResponsable) {

        this.rolResponsable = rolResponsable;
    }

    public String getArchivoAdjunto() {

        return archivoAdjunto;
    }

    public void setArchivoAdjunto(String archivoAdjunto) {

        this.archivoAdjunto = archivoAdjunto;
    }

    public String getIpOrigen() {

        return ipOrigen;
    }

    public void setIpOrigen(String ipOrigen) {

        this.ipOrigen = ipOrigen;
    }

    public String getObservacionTecnica() {

        return observacionTecnica;
    }

    public void setObservacionTecnica(String observacionTecnica) {

        this.observacionTecnica = observacionTecnica;
    }
}