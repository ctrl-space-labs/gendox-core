package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class AiModelMessage {
    private String role;
    private String content;
}
