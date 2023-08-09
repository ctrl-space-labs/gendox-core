package dev.ctrlspace.gendox.gendoxcoreapi.exceptions;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class GendoxErrorResponse {

    private Integer httpStatus;
    private String httpMessage;
    private String errorCode;
    private String errorMessage;
    private Instant timestamp;
    private Instant time;

}
