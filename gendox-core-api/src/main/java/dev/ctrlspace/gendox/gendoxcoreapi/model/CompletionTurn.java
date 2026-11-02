package dev.ctrlspace.gendox.gendoxcoreapi.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * A chat turn that waits for the results of CLIENT tool calls. The messages stay in the message
 * table; this row only says what the turn waits for and who may answer.
 */
@Entity
@Table(name = "completion_turn", schema = "gendox_core")
@Getter
@Setter
@NoArgsConstructor
public class CompletionTurn {

    public static final String WAITING_FOR_TOOLS = "WAITING_FOR_TOOLS";
    public static final String RESUMED = "RESUMED";
    public static final String CANCELLED = "CANCELLED";

    @Id
    private UUID id;
    private UUID threadId;
    private UUID projectId;
    private UUID userMessageId;
    private UUID assistantMessageId;
    private UUID actorId;
    private String sessionHash;
    private String status;

    @JdbcTypeCode(SqlTypes.JSON)
    private List<PendingCall> pendingCalls = new ArrayList<>();

    private int iteration;
    private Instant createdAt;

    // Given once, to the session that sent the message; only its hash is stored
    @Transient
    private String resumeToken;

    public record PendingCall(String id, UUID messageId, String name, String arguments) {}
}
