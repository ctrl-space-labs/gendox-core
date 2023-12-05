package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;
import java.util.List;

@Data
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class Ada2Response  {

    private List<EmbeddingData> data;
    private String model;
    private String object;
    private Usage usage;
}






