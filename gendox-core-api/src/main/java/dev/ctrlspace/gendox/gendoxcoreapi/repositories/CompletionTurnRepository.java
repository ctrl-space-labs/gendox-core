package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.CompletionTurn;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface CompletionTurnRepository extends JpaRepository<CompletionTurn, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from CompletionTurn t where t.threadId = :threadId and t.status = 'WAITING_FOR_TOOLS'")
    Optional<CompletionTurn> lockWaitingTurn(@Param("threadId") UUID threadId);

    Optional<CompletionTurn> findByThreadIdAndStatus(UUID threadId, String status);
}
