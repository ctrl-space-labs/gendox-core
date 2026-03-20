package dev.ctrlspace.gendox.gendoxcoreapi.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "deep_thinking_steps", schema = "gendox_core")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class DeepThinkingStep {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "job_execution_id", nullable = false)
    private Long jobExecutionId;

    @Column(name = "thread_id", nullable = false)
    private UUID threadId;

    @Column(name = "step_order", nullable = false)
    private Integer stepOrder;

    @Column(name = "step_type", nullable = false, length = 50)
    private String stepType;

    @Column(name = "summary", columnDefinition = "TEXT")
    private String summary;

    @Column(name = "message_id")
    private UUID messageId;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}
