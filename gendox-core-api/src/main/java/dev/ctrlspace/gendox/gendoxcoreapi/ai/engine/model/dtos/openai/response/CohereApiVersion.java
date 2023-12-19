package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class CohereApiVersion {

    private String version;
}
