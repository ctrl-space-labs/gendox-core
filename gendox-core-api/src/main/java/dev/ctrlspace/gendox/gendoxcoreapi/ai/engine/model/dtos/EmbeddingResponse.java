package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.EmbeddingData;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Usage;
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
public class EmbeddingResponse implements Serializable {

    private List<EmbeddingData> data;
    private String model;
    private String object;
    private Usage usage;
}