package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request;

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
public class BotRequest implements Serializable {
//    private String message;
    private List<String> messages;
}



