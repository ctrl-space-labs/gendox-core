package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.mistral.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class MistralOcrResponse {
    private List<Page> pages;
    private String model;
    private UsageInfo usageInfo;

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Page {
        private int index;
        private String markdown;
        private List<Image> images;
        private Dimensions dimensions;
    }

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Image {
        private String id;
        private int topLeftX;
        private int topLeftY;
        private int bottomRightX;
        private int bottomRightY;
        private String imageBase64;
    }

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Dimensions {
        private int dpi;
        private int height;
        private int width;
    }

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UsageInfo {
        private int pagesProcessed;
        private int docSizeBytes;
    }
}

