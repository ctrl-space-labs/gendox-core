package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MessageAttachmentsRequestDTO {
    @NotEmpty(message = "messageIds must not be empty")
    private List<@NotNull(message = "messageId must not be null") UUID> messageIds;

//    private List<UUID> messageIds;
}
