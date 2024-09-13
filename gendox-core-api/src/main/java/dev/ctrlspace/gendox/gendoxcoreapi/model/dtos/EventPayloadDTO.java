package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class EventPayloadDTO {
    private String organizationDid;
    private String projectAgentId;
    private String organizationId;
    private String AgentVcJwt;
}
