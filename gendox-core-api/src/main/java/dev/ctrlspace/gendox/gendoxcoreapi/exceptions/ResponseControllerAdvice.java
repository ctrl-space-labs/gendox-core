package dev.ctrlspace.gendox.gendoxcoreapi.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.time.Instant;
import java.util.stream.Collectors;

@ControllerAdvice
public class ResponseControllerAdvice extends ResponseEntityExceptionHandler {

    @ExceptionHandler(value = {Exception.class, UsernameNotFoundException.class, AuthenticationException.class, AccessDeniedException.class})
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
        } else if(ex instanceof MethodArgumentNotValidException) {
            MethodArgumentNotValidException validationException = (MethodArgumentNotValidException) ex;
            error.setHttpStatus(HttpStatus.BAD_REQUEST.value());
            error.setHttpMessage(HttpStatus.BAD_REQUEST.getReasonPhrase());
            error.setErrorMessage(ex.getMessage());
            error.setErrorCode("BAD_REQUEST");
            error.setTimestamp(Instant.now());

            error.setMetadata(validationException.getBindingResult()
                    .getFieldErrors()
                    .stream()
                    .map(x -> x.getDefaultMessage())
                    .collect(Collectors.toList()));
        } else if (ex instanceof AccessDeniedException){
            //returning 404 for access denied to hide the existence of the resource
            error.setHttpStatus(HttpStatus.NOT_FOUND.value());
            error.setHttpMessage(HttpStatus.NOT_FOUND.getReasonPhrase());
            error.setErrorMessage("Resource not found");
            error.setErrorCode("RESOURCE_NOT_FOUND");
            error.setTimestamp(Instant.now());
        }else {
            error.setHttpStatus(HttpStatus.INTERNAL_SERVER_ERROR.value());
            error.setHttpMessage(HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase());
            error.setErrorMessage(ex.getMessage());
            error.setErrorCode("INTERNAL_SERVER_ERROR");
            error.setTimestamp(Instant.now());
        }

        return ResponseEntity.status(error.getHttpStatus()).body(error);
    }
}
