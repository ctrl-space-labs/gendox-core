package dev.ctrlspace.gendox.gendoxcoreapi.exceptions;

import dev.ctrlspace.gendox.gendoxcoreapi.controller.UserController;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.io.Serializable;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@ControllerAdvice
public class ResponseControllerAdvice extends ResponseEntityExceptionHandler {


    Logger logger = LoggerFactory.getLogger(ResponseControllerAdvice.class);

    @ExceptionHandler(value = {
            Exception.class,
            UsernameNotFoundException.class,
            AuthenticationException.class,
            AccessDeniedException.class,
            ConstraintViolationException.class
    })
    protected ResponseEntity<Object> handleConflict(Exception ex, WebRequest request) {
        logger.error("Error in Gendox APP", ex);

        GendoxErrorResponse error = new GendoxErrorResponse();

        if (ex instanceof GendoxException) {
            GendoxException gendoxException = (GendoxException) ex;
            error.setHttpStatus(gendoxException.getHttpStatus().value());
            error.setHttpMessage(gendoxException.getHttpStatus().getReasonPhrase());
            error.setErrorMessage(gendoxException.getErrorMessage());
            error.setErrorCode(gendoxException.getErrorCode());
            error.setTimestamp(gendoxException.getTime());
        } else if (ex instanceof AccessDeniedException) {
            //returning 404 for access denied to hide the existence of the resource
            error.setHttpStatus(HttpStatus.NOT_FOUND.value());
            error.setHttpMessage(HttpStatus.NOT_FOUND.getReasonPhrase());
            error.setErrorMessage("Resource not found");
            error.setErrorCode("RESOURCE_NOT_FOUND");
            error.setTimestamp(Instant.now());
        } else {
            error.setHttpStatus(HttpStatus.INTERNAL_SERVER_ERROR.value());
            error.setHttpMessage(HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase());
            error.setErrorMessage(ex.getMessage());
            error.setErrorCode("INTERNAL_SERVER_ERROR");
            error.setTimestamp(Instant.now());
        }

        return ResponseEntity.status(error.getHttpStatus()).body(error);
    }

    @Override
    @Nullable
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {

        GendoxErrorResponse error = new GendoxErrorResponse();
        error.setHttpStatus(HttpStatus.BAD_REQUEST.value());
        error.setHttpMessage(HttpStatus.BAD_REQUEST.getReasonPhrase());
        error.setErrorCode("VALIDATION_ERROR");
        error.setErrorMessage(ex.getMessage());
        error.setTimestamp(Instant.now());

        List<FieldErrorDTO> fieldErrors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(fe -> new FieldErrorDTO(fe.getField(), fe.getDefaultMessage()))
                .collect(Collectors.toList());

        ex.getGlobalErrors()
                .stream()
                .map(fe -> new FieldErrorDTO(fe.getObjectName(), fe.getDefaultMessage()))
                .forEach(fieldErrors::add);


        error.setMetadata((Serializable) fieldErrors); // Assuming you add a setFieldErrors method to your GendoxErrorResponse

        return ResponseEntity.status(error.getHttpStatus()).body(error);
    }

    public record FieldErrorDTO(String field, String message) {
    }
}
