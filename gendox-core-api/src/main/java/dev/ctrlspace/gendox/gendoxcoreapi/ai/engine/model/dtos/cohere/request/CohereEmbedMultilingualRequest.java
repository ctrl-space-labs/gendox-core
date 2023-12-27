package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.request;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class CohereEmbedMultilingualRequest implements Serializable {

    private String model;
    private List<String> texts;
    private String input_type;
}
