package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.MessageLocalContext;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;


@Repository
public interface MessageLocalContextRepository extends JpaRepository<MessageLocalContext, UUID>, QuerydslPredicateExecutor<MessageLocalContext> {

    @Query("""
                select mlc
                from MessageLocalContext mlc
                join fetch mlc.message m
                left join fetch mlc.document d
                where m.id in :messageIds
                  and d is not null
            """)
    List<MessageLocalContext> findAllByMessageIdsWithDocument(List<UUID> messageIds);

    boolean existsByMessage_IdAndContextTypeName(UUID messageId, String contextTypeName);

    java.util.Optional<MessageLocalContext> findFirstByMessage_IdAndContextTypeName(UUID messageId, String contextTypeName);

    boolean existsByMessage_ThreadIdAndDocument_Id(UUID threadId, UUID documentId);

    boolean existsByMessage_ThreadIdAndDocumentIsNotNull(UUID threadId);

    /** The documents attached to a thread up to a moment, each once, in the order they were first attached. */
    @Query("""
              select d
              from MessageLocalContext mlc
              join mlc.document d
              where mlc.message.threadId = :threadId
                and mlc.message.createdAt <= :until
              group by d
              order by min(mlc.message.createdAt), min(mlc.createdAt)
            """)
    List<DocumentInstance> findThreadDocuments(UUID threadId, Instant until);

    @Query("""
              select (count(mlc) > 0)
              from MessageLocalContext mlc
              where mlc.message.threadId = :threadId
                and mlc.document.id = :documentId
            """)
    boolean existsDocumentInThread(UUID threadId, UUID documentId);

}
