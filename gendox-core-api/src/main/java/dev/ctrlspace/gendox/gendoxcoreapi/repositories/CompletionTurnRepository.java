package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.CompletionTurn;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import java.time.Instant;
import java.util.*;

public interface CompletionTurnRepository extends JpaRepository<CompletionTurn, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from CompletionTurn t where t.id = :id")
    Optional<CompletionTurn> lock(UUID id);
    Optional<CompletionTurn> findFirstByThreadIdOrderByCreatedAtDesc(UUID threadId);
    List<CompletionTurn> findByThreadIdOrderByCreatedAtAsc(UUID threadId);
    List<CompletionTurn> findByStatusAndDeadlineBefore(String status, Instant deadline);
    List<CompletionTurn> findByStatusAndHeartbeatBefore(String status, Instant heartbeat);
}
