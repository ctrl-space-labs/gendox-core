package dev.ctrlspace.gendox.gendoxcoreapi.exceptions;

import org.springframework.http.HttpStatus;

public class GendoxRuntimeException extends RuntimeException {

    private HttpStatus status;
    private String messageCode;
    private String message;

    public GendoxRuntimeException(HttpStatus status, String messageCode, String message) {
        this.status = status;
        this.messageCode = messageCode;
        this.message = message;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public void setStatus(HttpStatus status) {
        this.status = status;
    }

    public String getMessageCode() {
        return messageCode;
    }

    public void setMessageCode(String messageCode) {
        this.messageCode = messageCode;
    }

    @Override
    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
