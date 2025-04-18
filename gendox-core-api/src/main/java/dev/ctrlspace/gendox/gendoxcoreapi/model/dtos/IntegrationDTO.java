package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.util.UUID;
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class IntegrationDTO {

    private UUID id;
    private UUID organizationId;
    private UUID projectId;
    private Type integrationType;
    private Boolean active;
    private String url;
    private String queueName;
    private String directoryPath;
    private String repoHead;
    private String userName;
    private String password;
    private Instant createdAt;
    private Instant updatedAt;
    private UUID createdBy;
    private UUID updatedBy;






}
