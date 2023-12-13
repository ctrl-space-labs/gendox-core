package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.AiModelMessage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class Choice implements Serializable {
    private Integer index;
    private AiModelMessage message;
    @JsonProperty("finish_reason")
    private String finishReason;
}


