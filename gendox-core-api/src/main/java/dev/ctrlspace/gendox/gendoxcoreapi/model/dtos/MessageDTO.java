package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class MessageDTO {

    private UUID id;
    private String value;
    private UUID threadId;
    private UUID projectId;
    // 1 (👍), -1 (👎) or null (none), with an optional comment
    private Short feedback;
    private String feedbackComment;

}
