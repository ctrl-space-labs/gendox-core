package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class CompletionRequestDTO {

    private String value;
    private UUID threadId;

    @Builder.Default
    private boolean deepThinking = false;

    @Builder.Default
    private List<MessageLocalContextDTO> localContexts = new ArrayList<>();

    @Builder.Default
    private List<UUID> documentInstanceIds = new ArrayList<>();
}



