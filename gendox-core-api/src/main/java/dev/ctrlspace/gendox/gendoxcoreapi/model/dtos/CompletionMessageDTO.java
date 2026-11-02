package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import com.fasterxml.jackson.annotation.JsonInclude;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;


@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class CompletionMessageDTO {
    // Set only when the turn stopped to wait for CLIENT tool results (WAITING_FOR_TOOLS)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String status;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private UUID turnId;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String resumeToken;
    private List<Message> messages;
    private UUID threadId;
    private Long jobExecutionId;
    private List<ProvenAiMetadata> provenAiMetadata;
    // TODO review this to add more metadata about the sections involved in the response

}

