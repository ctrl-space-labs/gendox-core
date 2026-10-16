package dev.ctrlspace.gendox.gendoxcoreapi.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.util.*;

/** Operational state only. All model-visible content remains in the message tables. */
@Entity
@Table(name = "completion_turn", schema = "gendox_core")
@Getter @Setter @NoArgsConstructor
public class CompletionTurn {
    @Id private UUID id;
    private UUID threadId;
    private UUID projectId;
    private UUID userMessageId;
    private UUID actorId;
    private String sessionHash;
    private String status;
    @JdbcTypeCode(SqlTypes.JSON) private List<UUID> historyMessageIds = new ArrayList<>();
    @JdbcTypeCode(SqlTypes.JSON) private List<UUID> messageIds = new ArrayList<>();
    @JdbcTypeCode(SqlTypes.JSON) private List<PendingCall> pendingCalls = new ArrayList<>();
    private int iteration;
    private boolean clientToolResults;
    private String configurationHash;
    private UUID ownerId;
    private Instant deadline;
    private Instant heartbeat;
    private Instant createdAt;
    private String error;

    public record PendingCall(String id, UUID messageId, String name, String arguments) {}
}
