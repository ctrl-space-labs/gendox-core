package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import dev.ctrlspace.gendox.gendoxcoreapi.model.ChatThreadMember;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;


@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ChatThreadLastMessageDTO {
        private UUID id;
        private String name;
        private UUID projectId;
        private Instant createdAt;
        private Instant updatedAt;
        private UUID createdBy;
        private UUID updatedBy;
        private Boolean isActive;
        private List<ChatThreadMember> chatThreadMembers;
        private Boolean publicThread;
        private String latestMessageValue;
        private Instant latestMessageCreatedAt;

}
