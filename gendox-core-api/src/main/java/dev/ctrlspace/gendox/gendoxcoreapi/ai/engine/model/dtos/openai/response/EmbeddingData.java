package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response;

import com.pgvector.PGvector;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class EmbeddingData {
    //    private List<Double> embedding; //data type in Postgres - vector
    private List<Double> embedding;
    private Integer index;
    private String object;
}
