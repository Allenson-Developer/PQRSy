package com.pqrs.pqrs.dto;

public class LoginResponse {

    private String token;

    private String username;

    private String role;

    private String nombre;

    private String id;

   private String estado;


 public String getId() {
    return id;
 }

 public void setId(String id) {
    this.id = id;
 }

 public String getEstado() {
    return estado;
 }

 public void setEstado(String estado) {
    this.estado = estado;
 }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }
}