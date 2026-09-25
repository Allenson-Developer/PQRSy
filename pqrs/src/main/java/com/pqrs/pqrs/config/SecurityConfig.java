package com.pqrs.pqrs.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.pqrs.pqrs.security.JwtAuthenticationFilter;

@Configuration
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http

                //////////////////////////////////////////////////////
                // DESACTIVAR CSRF
                //////////////////////////////////////////////////////

                .csrf(csrf -> csrf.disable())

                //////////////////////////////////////////////////////
                // ACTIVAR CORS
                //////////////////////////////////////////////////////

                .cors(Customizer.withDefaults())

                //////////////////////////////////////////////////////
                // SIN SESIONES
                //////////////////////////////////////////////////////

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                //////////////////////////////////////////////////////
                // AUTORIZACIÓN
                //////////////////////////////////////////////////////

                .authorizeHttpRequests(auth -> auth

                        //////////////////////////////////////////////////////
                        // RUTAS PÚBLICAS
                        //////////////////////////////////////////////////////

                        .requestMatchers(
                                "/test/login",
                                "/test/register"
                        )
                        .permitAll()

                        //////////////////////////////////////////////////////
                        // RUTAS PROTEGIDAS
                        //////////////////////////////////////////////////////

                        .requestMatchers("/admin/**")
                        .hasRole("ADMIN")

                        .requestMatchers("/user/**")
                        .hasRole("USER")

                        .requestMatchers("/agente/**")
                        .hasRole("AGENTE")

                        .requestMatchers("/pqrs/**")
                        .authenticated()

                        .anyRequest()
                        .denyAll()
                );

        //////////////////////////////////////////////////////
        // FILTRO JWT
        //////////////////////////////////////////////////////

        http.addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
        );

        return http.build();
    }

    //////////////////////////////////////////////////////
    // CONFIGURACIÓN CORS
    //////////////////////////////////////////////////////

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        //////////////////////////////////////////////////////
        // ORIGINS
        //////////////////////////////////////////////////////

        configuration.setAllowedOrigins(
                List.of("*")
        );

        //////////////////////////////////////////////////////
        // MÉTODOS
        //////////////////////////////////////////////////////

        configuration.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "DELETE",
                        "PATCH",
                        "OPTIONS"
                )
        );

        //////////////////////////////////////////////////////
        // HEADERS
        //////////////////////////////////////////////////////

        configuration.setAllowedHeaders(
                List.of("*")
        );

        //////////////////////////////////////////////////////
        // CREDENTIALS
        //////////////////////////////////////////////////////

        configuration.setAllowCredentials(
                false
        );

        //////////////////////////////////////////////////////
        // SOURCE
        //////////////////////////////////////////////////////

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }
}