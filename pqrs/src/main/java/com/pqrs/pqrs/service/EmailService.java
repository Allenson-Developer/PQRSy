package com.pqrs.pqrs.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String correoRemitente;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void enviarCorreo(
            String destinatario,
            String asunto,
            String contenido
    ) {
        SimpleMailMessage mensaje = new SimpleMailMessage();

        mensaje.setFrom(correoRemitente);
        mensaje.setTo(destinatario);
        mensaje.setSubject(asunto);
        mensaje.setText(contenido);

        mailSender.send(mensaje);
    }

    public void enviarCorreoPrueba() {

        enviarCorreo(
                correoRemitente,
                "Prueba SMTP - Sistema PQRS",
                """
                ¡Hola!

                Este es un correo de prueba enviado desde nuestro
                sistema PQRS utilizando Java y Spring Boot.

                Si recibiste este mensaje, la conexión SMTP funciona.

                ¡Seguimos construyendo!
                """
        );
    }
}