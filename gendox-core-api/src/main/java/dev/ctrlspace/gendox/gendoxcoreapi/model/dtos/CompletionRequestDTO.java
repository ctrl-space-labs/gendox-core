package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonSetter;
import com.fasterxml.jackson.annotation.Nulls;
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
@NoArgsConstructor(onConstructor_ = @JsonCreator)
@Builder(toBuilder = true)
public class CompletionRequestDTO {

    private String value;
    // "user" (default) for a question; "tool" returns the result of a CLIENT tool call in value
    private String role;
    private String toolCallId;
    @Builder.Default
    @JsonSetter(nulls = Nulls.SKIP)
    private boolean stream = false;
    @Builder.Default
    @JsonSetter(nulls = Nulls.SKIP)
    private boolean clientToolResults = false;
    private UUID threadId;

    @Builder.Default
    @JsonSetter(nulls = Nulls.SKIP)
    private boolean deepThinking = false;

    @Builder.Default
    private List<MessageLocalContextDTO> localContexts = new ArrayList<>();

    @Builder.Default
    private List<UUID> documentInstanceIds = new ArrayList<>();
}



