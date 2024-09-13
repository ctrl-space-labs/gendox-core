package dev.ctrlspace.gendox.gendoxcoreapi.repositories;


import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.MessageMetadataDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID>, QuerydslPredicateExecutor<Message> {


    @Query(nativeQuery = true, name = "AiModelMessage.findPreviousMessages")
    List<AiModelMessage> findPreviousMessages(@Param("threadId") UUID threadId, @Param("before") Instant before, @Param("size") int size);


    @Query(name = "MessageMetadataDTO.getMessageMetadataByMessageId", nativeQuery = true)
    List<MessageMetadataDTO> getMessageMetadataByMessageId(@Param("messageId") UUID messageId);

}
