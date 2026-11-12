package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.mistral.request;

import com.fasterxml.jackson.annotation.JsonCreator;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor(onConstructor_ = @JsonCreator)
public class MistralOcrRequest {
    private String model;
    private String id;
    private Document document;
    private List<Integer> pages;
    private boolean includeImageBase64;
    private int imageLimit;
    private int imageMinSize;

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor(onConstructor_ = @JsonCreator)
    public static class Document {
        private String documentUrl;
        private String documentName;
        private String type;  // Should be "document_url"
    }
}

