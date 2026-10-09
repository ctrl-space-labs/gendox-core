package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * What a caller sends to create an integration. The type is its name, never the row from
 * `types`: those rows are inserted without an explicit id, so the same type carries a
 * different id in every database and no caller can know it in advance.
 * <p>
 * IntegrationDTO stays what it has become — the carrier handed to createIntegration —
 * instead of doubling as a public request body. There is no id here, because a caller
 * creating something has nothing to name it with.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class IntegrationCreateDTO {
    private String type;
    private UUID projectId;
    private Boolean active;
    private Integer runIntervalMinutes;
    private String url;
    private String repoHead;
    private String directoryPath;
    private String queueName;
}