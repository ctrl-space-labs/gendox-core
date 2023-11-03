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
@Builder(toBuilder = true)
public class Gpt35Request implements Serializable {
    private String model;
    private List<Gpt35Message> messages;
    private double temperature;
}
