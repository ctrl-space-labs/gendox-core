package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.request;

import kotlinx.serialization.json.JsonElement;
import kotlinx.serialization.json.JsonPrimitive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ProjectAgentVPOfferRequest {

    private String subjectDid;
    private String subjectKey;
    private String agentVcJwt;



}
