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


    /**
     * Fetches the latest messages from a thread in “two-window” chunks:
     * windowSize + (total % windowSize). This is useful for the LLM API caching.
     *
     * <p>
     * Example: for windowSize=25 and a total of 60 messages, you get
     * 25 + (60 % 25) = 35 messages.
     *
     * In worst case the message history is #25 messages, in best case it is 50 messages
     * </p>
     *
     * @param threadId   ID of the conversation thread
     * @param before     only include messages created before this timestamp
     * @param windowSize base window size (e.g. 25)
     * @return messages ordered by created_at DESC
     */
    @Query(nativeQuery = true, name = "AiModelMessage.findPreviousMessages")
    List<AiModelMessage> findPreviousMessages(@Param("threadId") UUID threadId, @Param("before") Instant before, @Param("window_size") int windowSize);


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
            role,
            name,
            tool_call_id,
            tool_calls,
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
            updated_by,
            role,
            name,
            tool_call_id,
            tool_calls
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
