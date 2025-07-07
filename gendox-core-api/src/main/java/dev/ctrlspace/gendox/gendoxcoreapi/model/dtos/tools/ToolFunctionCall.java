package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.tools;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class ToolFunctionCall<T> {

    private String name;
    private T arguments;
}
