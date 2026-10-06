package com.pqrs.pqrs.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
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
                // DESACTIVAR CSRF
                .csrf(csrf -> csrf.disable())

                // ACTIVAR CORS
                .cors(Customizer.withDefaults())

                // SIN SESIONES
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                // AUTORIZACIÓN
                .authorizeHttpRequests(auth -> auth

                        // ==============================
                        // RUTAS PÚBLICAS
                        // ==============================

                        .requestMatchers(
                                "/test/login",
                                "/test/register"
                        ).permitAll()

                        // ==============================
                        // PERFIL DE USUARIO
                        // ==============================

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/test/actualizar/**"
                        ).authenticated()

                        // ==============================
                        // RUTAS ADMIN
                        // ==============================

                        .requestMatchers("/admin/**")
                        .hasRole("ADMIN")

                       .requestMatchers(
                        HttpMethod.GET,
                          "/pqrs/todas",
                        "/pqrs/estadisticas-global",
                        "/pqrs/dashboard",
                        "/pqrs/prioridad/*",
                        "/pqrs/estado/*/prioridad/*"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/pqrs/*/estado",
                                "/pqrs/*/asignar",
                                "/pqrs/*/gestion-completa"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.GET,
                                "/pqrs/*/historial-admin"
                        ).hasRole("ADMIN")

                        // ==============================
                        // RUTAS USER
                        // ==============================

                        .requestMatchers(
                                HttpMethod.POST,
                                "/pqrs"
                        ).hasRole("USER")

                        .requestMatchers(
                                HttpMethod.GET,
                                "/pqrs/usuario/**",
                                "/pqrs/estadisticas/**"
                        ).hasRole("USER")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/pqrs/*"
                        ).hasRole("USER")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/pqrs/*"
                        ).hasRole("USER")

                        .requestMatchers(
                                HttpMethod.GET,
                                "/pqrs/*/historial"
                        ).hasRole("USER")

                        // ==============================
                        // RUTAS COMPARTIDAS
                        // ==============================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/pqrs/detalle/**",
                                "/pqrs/archivo/**"
                        ).authenticated()

                        /*
                         * RESPONDER:
                         * Actualmente el frontend USER utiliza este endpoint
                         * y el backend también lo permite como una respuesta
                         * genérica. Por ahora queda para cualquier usuario
                         * autenticado.
                         */
                        .requestMatchers(
                                HttpMethod.PUT,
                                "/pqrs/*/responder"
                        ).authenticated()

                        // ==============================
                        // AGENTE
                        // ==============================

                        .requestMatchers("/agente/**")
                        .hasRole("AGENTE")

                        // ==============================
                        // FALLBACK
                        // ==============================

                        .requestMatchers("/pqrs/**")
                        .authenticated()

                        .anyRequest()
                        .denyAll()
                );

        // FILTRO JWT
        http.addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
        );

        return http.build();
    }

    // ==============================
    // CONFIGURACIÓN CORS
    // ==============================

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        configuration.setAllowedOrigins(
                List.of("*")
        );

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

        configuration.setAllowedHeaders(
                List.of("*")
        );

        configuration.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }
}