package com.pqrs.pqrs.security;

import java.security.Key;
import java.util.Date;

import org.springframework.stereotype.Service;

import com.pqrs.pqrs.model.Usuario;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    //////////////////////////////////////////////////////
    // CLAVE SECRETA
    //////////////////////////////////////////////////////

    private static final String SECRET_KEY =
            "pqrs_jwt_secret_key_2026_super_segura_para_proyecto";

    //////////////////////////////////////////////////////
    // KEY
    //////////////////////////////////////////////////////

    private Key getSigningKey() {

        return Keys.hmacShaKeyFor(
                SECRET_KEY.getBytes()
        );
    }

    //////////////////////////////////////////////////////
    // GENERAR TOKEN
    //////////////////////////////////////////////////////

    public String generarToken(
            Usuario usuario
    ) {

        return Jwts.builder()

                .setSubject(
                        usuario.getUsername()
                )

                .claim(
                        "role",
                        usuario.getRole()
                )

                .claim(
                        "estado",
                        usuario.getEstado()
                )

                .setIssuedAt(
                        new Date()
                )

                .setExpiration(
                        new Date(
                                System.currentTimeMillis()
                                        + 1000L * 60 * 60 * 24
                        )
                )

                .signWith(
                        getSigningKey()
                )

                .compact();
    }

    //////////////////////////////////////////////////////
    // OBTENER USERNAME
    //////////////////////////////////////////////////////

    public String extractUsername(
            String token
    ) {

        return extractClaims(token)
                .getSubject();
    }

    //////////////////////////////////////////////////////
    // OBTENER CLAIMS
    //////////////////////////////////////////////////////

    public Claims extractClaims(
            String token
    ) {

        return Jwts.parserBuilder()

                .setSigningKey(
                        getSigningKey()
                )

                .build()

                .parseClaimsJws(
                        token
                )

                .getBody();
 }

     public String extractRole(
        String token
   ) {

    return extractClaims(token)
             .get("role", String.class);
   }

   public boolean isTokenExpired(
        String token
 ) {

    return extractClaims(token)
            .getExpiration()
            .before(new Date());
 }

}