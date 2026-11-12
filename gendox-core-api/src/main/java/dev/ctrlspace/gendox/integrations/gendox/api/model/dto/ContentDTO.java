package dev.ctrlspace.gendox.integrations.gendox.api.model.dto;

import com.fasterxml.jackson.annotation.JsonCreator;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor(onConstructor_ = @JsonCreator)
@Builder(toBuilder = true)
public class ContentDTO {
    private int id;
    private String content;
    private String source;
}