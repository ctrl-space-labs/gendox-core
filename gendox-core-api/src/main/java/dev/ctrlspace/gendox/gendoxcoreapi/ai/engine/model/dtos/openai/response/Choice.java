package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.Gpt35Message;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.GptMessage;
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
    private GptMessage message;
    @JsonProperty("finish_reason")
    private String finishReason;
}


