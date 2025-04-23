package dev.ctrlspace.gendox.gendoxcoreapi.repositories;


import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.MessageMetadataDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID>, QuerydslPredicateExecutor<Message> {


    @Query(nativeQuery = true, name = "AiModelMessage.findPreviousMessages")
    List<AiModelMessage> findPreviousMessages(@Param("threadId") UUID threadId, @Param("before") Instant before, @Param("size") int size);


    @Query(name = "MessageMetadataDTO.getMessageMetadataByMessageId", nativeQuery = true)
    List<MessageMetadataDTO> getMessageMetadataByMessageId(@Param("messageId") UUID messageId);

    @Query(value = """
    WITH ranked_messages AS (
        SELECT
            id,
            value,
            project_id,
            thread_id,
            created_at,
            updated_at,
            created_by,
            updated_by,
            ROW_NUMBER() OVER (PARTITION BY thread_id ORDER BY created_at DESC) AS row_number
        FROM gendox_core.message
        WHERE thread_id IN :threadIds
    )
    SELECT id,
            value,
            project_id,
            thread_id,
            created_at,
            updated_at,
            created_by,
            updated_by
    FROM ranked_messages
    WHERE row_number = 1
""", nativeQuery = true)
    List<Message> findLatestMessagesForThreads(@Param("threadIds") List<UUID> threadIds);


    @Query("SELECT COUNT(m) FROM Message m WHERE m.projectId IN :projectIds AND m.createdAt BETWEEN :startDate AND :endDate")
    long countMessagesByProjectIdsAndDateRange(
            @Param("projectIds") Set<UUID> projectIds,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate
    );


}
