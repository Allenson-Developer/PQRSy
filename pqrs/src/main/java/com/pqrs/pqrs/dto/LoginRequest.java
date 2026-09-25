package com.pqrs.pqrs.dto;

public class LoginRequest {

    //////////////////////////////////////////////////////
    // ATRIBUTOS
    //////////////////////////////////////////////////////

    private String username;

    private String password;

    // SOLO PARA ADMIN
    private String documento;

    //////////////////////////////////////////////////////
    // GETTERS & SETTERS
    //////////////////////////////////////////////////////

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

    public String getDocumento() {

        return documento;
    }

    public void setDocumento(String documento) {

        this.documento = documento;
    }
}