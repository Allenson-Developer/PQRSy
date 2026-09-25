package com.pqrs.pqrs.model;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "pqrs")
public class Pqrs {

    //////////////////////////////////////////////////////
    // ID
    //////////////////////////////////////////////////////

    @Id
    private String id;

    //////////////////////////////////////////////////////
    // TIPO PQRS
    //////////////////////////////////////////////////////

    /*
        PETICION
        QUEJA
        RECLAMO
        SUGERENCIA
    */

    private String tipo;

    //////////////////////////////////////////////////////
    // DESCRIPCIÓN
    //////////////////////////////////////////////////////

    private String descripcion;

    //////////////////////////////////////////////////////
    // ESTADO ACTUAL
    //////////////////////////////////////////////////////

    /*
        PENDIENTE
        PROCESO
        RESUELTO
        CERRADO
    */

    private String estado;

    //////////////////////////////////////////////////////
    // FECHA CREACIÓN
    //////////////////////////////////////////////////////

    private Date fecha;

    //////////////////////////////////////////////////////
    // USUARIO
    //////////////////////////////////////////////////////

    private String usuarioId;

    private String username;

    private String nombre;

    //////////////////////////////////////////////////////
    // ARCHIVO ADJUNTO
    //////////////////////////////////////////////////////

    private String archivo;

    //////////////////////////////////////////////////////
    // AGENTE ASIGNADO
    //////////////////////////////////////////////////////

    private String agenteAsignado;

    //////////////////////////////////////////////////////
    // RESPUESTAS CHAT
    //////////////////////////////////////////////////////

    private List<Respuesta> respuestas =
            new ArrayList<>();

    //////////////////////////////////////////////////////
    // RESPUESTA CERRADA ADMIN
    //////////////////////////////////////////////////////

    /*
        Esta respuesta aparece en el inicio del panel.

        Solo puede enviarse:
        1. Cuando llega el PQRS
        2. Cuando cambia a RESUELTO

        Después se bloquea nuevamente.
    */

    private String respuestaAdmin;

    //////////////////////////////////////////////////////
    // FECHA RESPUESTA ADMIN
    //////////////////////////////////////////////////////

    private Date fechaRespuestaAdmin;


    private String titulo;


    //////////////////
    //ALTA, MEDIA, BAJA
    //////////////////
    private String prioridad;


    private Date fechaCierre;


    private Date fechaPrimeraRespuesta;

    //////////////////////////////////////////////////////
    // TIPO RESPUESTA
    //////////////////////////////////////////////////////

    /*
        INICIAL
        FINAL
    */

    private String tipoRespuestaAdmin;

    //////////////////////////////////////////////////////
    // CONTROL DE ENVÍOS
    //////////////////////////////////////////////////////

    /*
        false = puede enviar
        true = bloqueado
    */

    private boolean respuestaInicialEnviada = false;

    private boolean respuestaFinalEnviada = false;

    //////////////////////////////////////////////////////
    // GETTERS & SETTERS
    //////////////////////////////////////////////////////

    public String getId() {

        return id;
    }

    public void setId(String id) {

        this.id = id;
    }

    public String getTipo() {

        return tipo;
    }

    public void setTipo(String tipo) {

        this.tipo = tipo;
    }

    public String getDescripcion() {

        return descripcion;
    }

    public void setDescripcion(String descripcion) {

        this.descripcion = descripcion;
    }

    public String getEstado() {

        return estado;
    }

    public void setEstado(String estado) {

        this.estado = estado;
    }

    public Date getFecha() {

        return fecha;
    }

    public void setFecha(Date fecha) {

        this.fecha = fecha;
    }

    public String getUsuarioId() {

        return usuarioId;
    }

    public void setUsuarioId(String usuarioId) {

        this.usuarioId = usuarioId;
    }

    public String getUsername() {

        return username;
    }

    public void setUsername(String username) {

        this.username = username;
    }

    public String getNombre() {

        return nombre;
    }

    public void setNombre(String nombre) {

        this.nombre = nombre;
    }

    public String getArchivo() {

        return archivo;
    }

    public void setArchivo(String archivo) {

        this.archivo = archivo;
    }

    public String getAgenteAsignado() {

        return agenteAsignado;
    }

    public void setAgenteAsignado(String agenteAsignado) {

        this.agenteAsignado = agenteAsignado;
    }

    //////////////////////////////////////////////////////
    // RESPUESTAS CHAT
    //////////////////////////////////////////////////////

    public List<Respuesta> getRespuestas() {

        return respuestas;
    }

    public void setRespuestas(List<Respuesta> respuestas) {

        this.respuestas = respuestas;
    }

    //////////////////////////////////////////////////////
    // RESPUESTA ADMIN
    //////////////////////////////////////////////////////

    public String getRespuestaAdmin() {

        return respuestaAdmin;
    }

    public void setRespuestaAdmin(String respuestaAdmin) {

        this.respuestaAdmin = respuestaAdmin;
    }

    public Date getFechaRespuestaAdmin() {

        return fechaRespuestaAdmin;
    }

    public void setFechaRespuestaAdmin(
            Date fechaRespuestaAdmin
    ) {

        this.fechaRespuestaAdmin =
                fechaRespuestaAdmin;
    }

    public String getTipoRespuestaAdmin() {

        return tipoRespuestaAdmin;
    }

    public void setTipoRespuestaAdmin(
            String tipoRespuestaAdmin
    ) {

        this.tipoRespuestaAdmin =
                tipoRespuestaAdmin;
    }

    //////////////////////////////////////////////////////
    // CONTROL ENVÍOS
    //////////////////////////////////////////////////////

    public boolean isRespuestaInicialEnviada() {

        return respuestaInicialEnviada;
    }

    public void setRespuestaInicialEnviada(
            boolean respuestaInicialEnviada
    ) {

        this.respuestaInicialEnviada =
                respuestaInicialEnviada;
    }

    public boolean isRespuestaFinalEnviada() {

        return respuestaFinalEnviada;
    }

    public void setRespuestaFinalEnviada(
            boolean respuestaFinalEnviada
    ) {

        this.respuestaFinalEnviada =
                respuestaFinalEnviada;
    }

    ////////////
    /// NEW ATRIBUTOS
    /////////////

    public String getPrioridad() {
    return prioridad;
    }

    public void setPrioridad(String prioridad) {
    this.prioridad = prioridad;
    }
   public Date getFechaCierre() {
    return fechaCierre;
  }

  public void setFechaCierre(Date fechaCierre) {
    this.fechaCierre = fechaCierre;
  }
 public Date getFechaPrimeraRespuesta() {
    return fechaPrimeraRespuesta;
  }

  public void setFechaPrimeraRespuesta(
        Date fechaPrimeraRespuesta
 ) {
    this.fechaPrimeraRespuesta =
            fechaPrimeraRespuesta; 
  }

  public String getTitulo() {

    return titulo; 
 }

public void setTitulo(String titulo) {

    this.titulo = titulo;
 }



}