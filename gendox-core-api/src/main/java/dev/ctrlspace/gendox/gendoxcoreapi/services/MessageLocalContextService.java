package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.MessageLocalContext;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ContentPart;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.MessageAttachmentDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.MessageAttachmentsResponseDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.DocumentInstanceRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.MessageLocalContextRepository;
import jakarta.transaction.Transactional;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class MessageLocalContextService {
    private final DocumentInstanceRepository documentInstanceRepository;
    private final MessageLocalContextRepository messageLocalContextRepository;
    private final DownloadService downloadService;

    @Autowired
    public MessageLocalContextService(DocumentInstanceRepository documentInstanceRepository,
                                      MessageLocalContextRepository messageLocalContextRepository, DownloadService downloadService) {
        this.documentInstanceRepository = documentInstanceRepository;
        this.messageLocalContextRepository = messageLocalContextRepository;
        this.downloadService = downloadService;
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

        // ensure messages with 0 attachments are present
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


    public @NotNull List<ContentPart> getImageContentPartsFromLocalContext(Message message) {
        List<ContentPart> attachedImages = message.getLocalContexts().stream()
                .filter(c -> "ATTACHED_DOCUMENT".equals(c.getContextTypeName()))
                .map(c -> c.getDocument())
                .filter(Objects::nonNull)
                .filter(d -> {
                    try {
                        return downloadService.isImageFile(downloadService.getFileExtension(d.getRemoteUrl(), null));
                    } catch (GendoxException e) {
                        return false;
                    }
                })
                .map(d -> {
                    try {
                        return ContentPart.builder()
                                .type("image_url")
                                .imageUrl(ContentPart.ImageInput.builder()
                                        .url(downloadService.readDocumentImageToBase64(d.getRemoteUrl()))
                                        .build())
                                .build();
                    } catch (Exception e) {
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        return attachedImages;
    }
}
