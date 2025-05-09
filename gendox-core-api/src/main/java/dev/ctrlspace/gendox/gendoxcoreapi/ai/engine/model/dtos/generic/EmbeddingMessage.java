package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class EmbeddingMessage implements Serializable {
    private List<String> messages;
}



