package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.MessageLocalContext;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.MessageAttachmentDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.MessageAttachmentsResponseDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.DocumentInstanceRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.MessageLocalContextRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class MessageLocalContextService {
    private final DocumentInstanceRepository documentInstanceRepository;
    private final MessageLocalContextRepository messageLocalContextRepository;

    @Autowired
    public MessageLocalContextService(DocumentInstanceRepository documentInstanceRepository,
                                      MessageLocalContextRepository messageLocalContextRepository) {
        this.documentInstanceRepository = documentInstanceRepository;
        this.messageLocalContextRepository = messageLocalContextRepository;
    }

    /**
     * Build (NOT save) MessageLocalContext entities for each document id.
     * - skips nulls
     * - deduplicates ids
     * - validates documents exist (optional but recommended)
     */
    public List<MessageLocalContext> buildContextsFromDocumentIds(
            Message message,
            List<UUID> documentIds,
            String contextTypeName
    ) throws GendoxException {

        if (message == null) {
            throw new GendoxException("MESSAGE_REQUIRED", "message is required", HttpStatus.BAD_REQUEST);
        }
        if (documentIds == null || documentIds.isEmpty()) return List.of();

        List<UUID> normalized = documentIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        if (normalized.isEmpty()) return List.of();

        // Load docs in one query (and validate exist)
        List<DocumentInstance> docs = documentInstanceRepository.findAllById(normalized);

        Set<UUID> foundIds = new HashSet<>(docs.stream().map(DocumentInstance::getId).toList());
        List<UUID> missing = normalized.stream().filter(id -> !foundIds.contains(id)).toList();
        if (!missing.isEmpty()) {
            throw new GendoxException("DOCUMENT_NOT_FOUND", "Documents not found: " + missing, HttpStatus.NOT_FOUND);
        }

        String type = (contextTypeName == null || contextTypeName.isBlank())
                ? "ATTACHED_DOCUMENT" // default type (optional but recommended to avoid nulls)
                : contextTypeName;

        List<MessageLocalContext> result = new ArrayList<>();
        for (DocumentInstance doc : docs) {
            MessageLocalContext ctx = new MessageLocalContext();
            ctx.setMessage(message);
            ctx.setContextTypeName(type);
            ctx.setDocument(doc);
            ctx.setValue(null); // optional
            result.add(ctx);
        }

        return result;
    }

    /**
     * Build AND save (useful if you decide to save contexts independently from cascade)
     */
    @Transactional
    public List<MessageLocalContext> createContextsFromDocumentIds(
            Message message,
            List<UUID> documentIds,
            String contextTypeName
    ) throws GendoxException {
        List<MessageLocalContext> contexts = buildContextsFromDocumentIds(message, documentIds, contextTypeName);
        if (contexts.isEmpty()) return contexts;
        return messageLocalContextRepository.saveAll(contexts);
    }

    @Transactional
    public MessageAttachmentsResponseDTO getAttachmentsByMessageIds(List<UUID> messageIds) {

        if (messageIds == null || messageIds.isEmpty()) {
            return MessageAttachmentsResponseDTO.builder()
                    .attachmentsByMessageId(Collections.emptyMap())
                    .build();
        }

        // normalize (remove nulls + duplicates)
        List<UUID> normalized = messageIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        if (normalized.isEmpty()) {
            return MessageAttachmentsResponseDTO.builder()
                    .attachmentsByMessageId(Collections.emptyMap())
                    .build();
        }

        // one query: message_local_context + document
        List<MessageLocalContext> rows =
                messageLocalContextRepository.findAllByMessageIdsWithDocument(normalized);

        Map<UUID, List<MessageAttachmentDTO>> map =
                rows.stream()
                        .collect(Collectors.groupingBy(
                                mlc -> mlc.getMessage().getId(),
                                Collectors.mapping(mlc ->
                                                MessageAttachmentDTO.builder()
                                                        .documentId(mlc.getDocument().getId())
                                                        .title(mlc.getDocument().getTitle())
                                                        .remoteUrl(mlc.getDocument().getRemoteUrl())
                                                        .externalUrl(mlc.getDocument().getExternalUrl())
                                                        .fileSizeBytes(mlc.getDocument().getFileSizeBytes())
                                                        .fileType(mlc.getDocument().getFileType())
                                                        .build(),
                                        Collectors.toList()
                                )
                        ));

        // ensure messages with 0 attachments are present (optional αλλά ωραίο)
        normalized.forEach(id -> map.putIfAbsent(id, new ArrayList<>()));

        return MessageAttachmentsResponseDTO.builder()
                .attachmentsByMessageId(map)
                .build();
    }

    @Transactional
    public boolean isDocumentAttachedToThread(UUID threadId, UUID documentId) {
        if (threadId == null || documentId == null) return false;

        return messageLocalContextRepository
                .existsByMessage_ThreadIdAndDocument_Id(threadId, documentId);
    }


}
