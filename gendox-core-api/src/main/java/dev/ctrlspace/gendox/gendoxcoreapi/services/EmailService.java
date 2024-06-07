package dev.ctrlspace.gendox.gendoxcoreapi.services;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Properties;

@Service
public class EmailService {

    private JavaMailSender mailSender;

    @Autowired
    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendEmail(
            String to,
            String subject,
            String htmlContent,
            String plainTextContent,
            List<File> attachments,
            @Nullable String username,
            @Nullable String password,
            @Nullable String host,
            @Nullable Integer port,
            @Nullable Properties additionalProperties) throws MessagingException {

        JavaMailSenderImpl customMailSender = getCustomMailSender(username, password, host, port, additionalProperties);

        MimeMessage message = customMailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, StandardCharsets.UTF_8.name());

        helper.setFrom(customMailSender.getUsername());
        helper.setTo(to);
        helper.setSubject(subject);

        helper.setText(plainTextContent, htmlContent);

        if (attachments != null) {
            for (File attachment : attachments) {
                if (attachment.exists()) {
                    FileSystemResource file = new FileSystemResource(attachment);
                    helper.addAttachment(file.getFilename(), file);
                }
            }
        }

        customMailSender.send(message);
    }

    @NotNull
    private JavaMailSenderImpl getCustomMailSender(@Nullable String username, @Nullable String password, @Nullable String host, @Nullable Integer port, @Nullable Properties additionalProperties) {
        JavaMailSenderImpl customMailSender = new JavaMailSenderImpl();
        customMailSender.setHost(host != null ? host : ((JavaMailSenderImpl) mailSender).getHost());
        customMailSender.setPort(port != null ? port : ((JavaMailSenderImpl) mailSender).getPort());
        customMailSender.setUsername(username != null ? username : ((JavaMailSenderImpl) mailSender).getUsername());
        customMailSender.setPassword(password != null ? password : ((JavaMailSenderImpl) mailSender).getPassword());

        Properties props = customMailSender.getJavaMailProperties();
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");

        if (additionalProperties != null) {
            props.putAll(additionalProperties);
        }

        customMailSender.setJavaMailProperties(props);
        return customMailSender;
    }

    public void sendEmail(
            String to,
            String subject,
            String htmlContent,
            String plainTextContent,
            List<File> attachments) throws MessagingException {

        sendEmail(to, subject, htmlContent, plainTextContent, attachments, null, null, null, null, null);
    }

    public void sendEmail(
            String to,
            String subject,
            String htmlContent,
            String plainTextContent) throws MessagingException {

        sendEmail(to, subject, htmlContent, plainTextContent, null);
    }
}
