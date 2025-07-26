package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * This class represents additional resources that can be associated with a message.
 * They can be files url, images (url and base64), or any other type of resource.
 *
 * This class maps the OpenAI context list which can provide multiple inputs for a single message.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ContentPart {

    // "text", "image_url", "input_audio"
    private String type;

    private String text;

    @JsonProperty("image_url")
    private ImageInput imageUrl;

    @JsonProperty("input_audio")
    private AudioInput inputAudio;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder(toBuilder = true)
    public static class ImageInput {
        // it can be a base64 string or a public URL
        private String url;
    }


    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder(toBuilder = true)
    public static class AudioInput {
        private String data;
        private String format = "wav";
    }

//    Only image and text is supported for now, but this can be extended in the future.
//    @JsonProperty("file_id")
//    private String fileId;
}
