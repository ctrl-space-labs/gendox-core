package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos;

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
    private List<String> messages;
}



