package com.pqrs.pqrs.security;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter
        extends OncePerRequestFilter {

    @Autowired
    private JwtService jwtService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String authHeader =
                request.getHeader("Authorization");

        System.out.println(
                "AUTH HEADER: " + authHeader
        );

        if (
                authHeader != null
                        && authHeader.startsWith("Bearer ")
        ) {

            String token =
                    authHeader.substring(7);

            try {

                if (
                        jwtService.isTokenExpired(token)
                ) {

                    System.out.println(
                            "TOKEN EXPIRADO"
                    );

                    filterChain.doFilter(
                            request,
                            response
                    );

                    return;
                }

                String username =
                        jwtService.extractUsername(token);

                String role =
                        jwtService.extractRole(token);

                System.out.println(
                        "USUARIO JWT: "
                                + username
                );

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                username,
                                null,
                                List.of(
                                        new SimpleGrantedAuthority(
                                                "ROLE_" + role
                                        )
                                )
                        );

                SecurityContextHolder
                        .getContext()
                        .setAuthentication(authentication);

            } catch (Exception e) {

                System.out.println(
                        "TOKEN INVALIDO: "
                                + e.getMessage()
                );
            }
        }

        filterChain.doFilter(
                request,
                response
        );
    }
}