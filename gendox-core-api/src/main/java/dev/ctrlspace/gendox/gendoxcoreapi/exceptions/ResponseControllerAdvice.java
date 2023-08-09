package dev.ctrlspace.gendox.gendoxcoreapi.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.time.Instant;

@ControllerAdvice
public class ResponseControllerAdvice extends ResponseEntityExceptionHandler {

    @ExceptionHandler(value = {Exception.class, UsernameNotFoundException.class, AuthenticationException.class})
    protected ResponseEntity<Object> handleConflict(Exception ex, WebRequest request) {
        logger.error("Error in Gendox APP", ex);

        GendoxErrorResponse error = new GendoxErrorResponse();

        if (ex instanceof GendoxException) {
            GendoxException gendoxException = (GendoxException) ex;
            error.setHttpStatus(gendoxException.getHttpStatus().value());
            error.setHttpMessage(gendoxException.getHttpStatus().getReasonPhrase());
            error.setErrorMessage(gendoxException.getErrorMessage());
            error.setErrorCode(gendoxException.getErrorCode());
            error.setTime(gendoxException.getTime());
        } else {
            error.setHttpStatus(HttpStatus.INTERNAL_SERVER_ERROR.value());
            error.setHttpMessage(HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase());
            error.setErrorMessage(ex.getMessage());
            error.setErrorCode("INTERNAL_SERVER_ERROR");
            error.setTime(Instant.now());
        }

        return ResponseEntity.status(error.getHttpStatus()).body(error);
    }
}
