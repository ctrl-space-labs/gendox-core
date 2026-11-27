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
import java.util.*;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID>, QuerydslPredicateExecutor<Message> {


    /**
     * Fetches the latest turns of a thread in “two-window” chunks: windowTurns + (turns % windowTurns).
     * A turn is a user message with everything after it (tool calls, tool results, the answer), so the
     * history always starts at a question and a turn is never cut in half. The window moves a whole
     * window at a time, which keeps the start of the prompt the same for the LLM API caching.
     *
     * <p>
     * Example: for windowTurns=10 and 23 earlier turns, you get 10 + (23 % 10) = 13 turns:
     * at least 10, at most 19.
     * </p>
     *
     * @param threadId    ID of the conversation thread
     * @param before      only include messages created before this timestamp
     * @param windowTurns base window size in turns (e.g. 10)
     * @return messages ordered by created_at DESC
     */
    @Query(nativeQuery = true, name = "AiModelMessage.findPreviousMessages")
    List<AiModelMessage> findPreviousMessages(@Param("threadId") UUID threadId, @Param("before") Instant before, @Param("window_turns") int windowTurns);


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
                        reasoning_content,
                        reasoning_metadata,
                        ai_model_id,
                        feedback,
                        feedback_comment,
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
                        tool_calls,
                        reasoning_content,
                        reasoning_metadata,
                        ai_model_id,
                        feedback,
                        feedback_comment
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

    boolean existsByIdAndThreadId(UUID id, UUID threadId);

    @Query("""
                select m.id
                from Message m
                where m.threadId = :threadId
                  and m.id in :messageIds
            """)
    List<UUID> findIdsByThreadIdAndIdIn(@Param("threadId") UUID threadId,
                                        @Param("messageIds") List<UUID> messageIds);



    @Query("select distinct m from Message m left join fetch m.localContexts c left join fetch c.document where m.id = :id")
    Optional<Message> findWithLocalContextsById(@Param("id") UUID id);

    List<Message> findByThreadIdAndCreatedAtAfterOrderByCreatedAtAsc(UUID threadId, Instant createdAt);

    Optional<Message> findFirstByThreadIdOrderByCreatedAtDesc(UUID threadId);

    @Query("SELECT m.threadId FROM Message m WHERE m.id = :id")
    Optional<UUID> findThreadIdById(@Param("id") UUID id);

    Optional<Message> findFirstByThreadIdAndRoleOrderByCreatedAtDesc(UUID threadId, String role);

    Optional<Message> findFirstByThreadIdAndRoleAndToolCallIdOrderByCreatedAtDesc(UUID threadId, String role, String toolCallId);

    /** The results of some tools in a thread: what the artifact tools returned, to know which version it has seen. */
    List<Message> findAllByThreadIdAndRoleAndNameIn(UUID threadId, String role, Collection<String> names);
}
