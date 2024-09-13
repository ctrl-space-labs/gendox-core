package dev.ctrlspace.gendox.gendoxcoreapi.exceptions;

import lombok.Data;
import org.springframework.http.HttpStatus;

import java.io.Serializable;
import java.time.Instant;

@Data
public class GendoxException extends Exception {

    private String errorCode;
    private String errorMessage;
    private HttpStatus httpStatus;
    private Instant time;
    private Object data;

    public GendoxException(String errorCode, String errorMessage, HttpStatus httpStatus) {
        super(errorMessage);
        this.errorCode = errorCode;
        this.errorMessage = errorMessage;
        this.httpStatus = httpStatus;
        this.time = Instant.now();
        this.data = null;
    }
    public GendoxException(String errorCode, String errorMessage, HttpStatus httpStatus, Object data) {
        super(errorMessage);
        this.errorCode = errorCode;
        this.errorMessage = errorMessage;
        this.httpStatus = httpStatus;
        this.time = Instant.now();
        this.data = data;
    }
}
