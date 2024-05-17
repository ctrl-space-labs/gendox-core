package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.request;

import kotlinx.serialization.json.JsonElement;
import kotlinx.serialization.json.JsonObject;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class VerifiableCredentialRequest {

    private Duration validityPeriod;

    private String context;

    private String type;

    private Instant validUntil;

    private Map<String, String> additionalJwtHeaders;

    private Map<String, JsonElement> additionalJwtOptions;

    private JsonObject credentialSubject;






}
