package dev.ctrlspace.gendox.gendoxcoreapi.services;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.DocumentOnlyConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ChatThread;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ChatThreadMember;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.MessageSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceSectionDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.MessageMetadataDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.MessageCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.DocumentInstanceSectionRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.MessageRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.MessageSectionRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.MessagePredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import jakarta.annotation.Nullable;
import jakarta.transaction.Transactional;

@Service
public class MessageService {

    private MessageRepository messageRepository;

    private MessageSectionRepository messageSectionRepository;
    private SecurityUtils securityUtils;
    private ChatThreadService chatThreadService;
    private ProjectAgentService projectAgentService;
    private DocumentInstanceSectionRepository documentInstanceSectionRepository;
    private DocumentOnlyConverter documentOnlyConverter;

    @Autowired
    public MessageService(MessageRepository messageRepository,
                          MessageSectionRepository messageSectionRepository,
                          SecurityUtils securityUtils,
                          ChatThreadService chatThreadService,
                          ProjectAgentService projectAgentService,
                          DocumentInstanceSectionRepository documentInstanceSectionRepository,
                          DocumentOnlyConverter documentOnlyConverter) {
        this.messageRepository = messageRepository;
        this.messageSectionRepository = messageSectionRepository;
        this.securityUtils = securityUtils;
        this.chatThreadService = chatThreadService;
        this.projectAgentService = projectAgentService;
        this.documentInstanceSectionRepository = documentInstanceSectionRepository;
        this.documentOnlyConverter = documentOnlyConverter;
    }


    public Page<Message> getAllMessagesByCriteria(MessageCriteria criteria, Pageable pageable) {
        return messageRepository.findAll(MessagePredicates.build(criteria), pageable);
    }

    public Message getMessageById(UUID messageId) throws GendoxException {
        return messageRepository.findById(messageId)
                .orElseThrow(() -> new GendoxException("MESSAGE_NOT_FOUND",
                        "Message not found: " + messageId,
                        org.springframework.http.HttpStatus.NOT_FOUND));
    }

    /** The messages with their local contexts (and the contexts' documents) loaded, by id. */
    public Map<UUID, Message> getMessagesWithLocalContexts(List<UUID> messageIds) {
        if (messageIds.isEmpty()) {
            return Map.of();
        }
        return messageRepository.findWithLocalContextsByIds(messageIds).stream()
                .collect(Collectors.toMap(Message::getId, Function.identity()));
    }

    /** The messages saved in the thread after the given one, oldest first. */
    public List<Message> getMessagesAfter(Message message) {
        return messageRepository.findByThreadIdAndCreatedAtAfterOrderByCreatedAtAsc(message.getThreadId(), message.getCreatedAt());
    }

    public List<MessageSection> getMessageSections(UUID messageId) {
        return messageSectionRepository.findByMessageIdOrderByCreatedAtAsc(messageId);
    }

    /**
     * The sections each message was answered with (its completion participants), in the order they
     * were linked, ready for the agent's section template.
     */
    public Map<UUID, List<DocumentInstanceSectionDTO>> getCompletionSections(List<UUID> messageIds) {
        if (messageIds.isEmpty()) {
            return Map.of();
        }
        List<MessageSection> links = messageSectionRepository.findCompletionParticipants(messageIds);
        Set<UUID> sectionIds = links.stream().map(MessageSection::getSectionId).collect(Collectors.toSet());
        Map<UUID, DocumentInstanceSection> sections = documentInstanceSectionRepository.findAllById(sectionIds).stream()
                .collect(Collectors.toMap(DocumentInstanceSection::getId, Function.identity()));

        return links.stream()
                .filter(link -> sections.containsKey(link.getSectionId()))
                .collect(Collectors.groupingBy(link -> link.getMessage().getId(),
                        Collectors.mapping(link -> toTemplateSection(sections.get(link.getSectionId())), Collectors.toList())));
    }

    // Only what the section template reads: the text and its document
    private DocumentInstanceSectionDTO toTemplateSection(DocumentInstanceSection section) {
        DocumentInstanceSectionDTO dto = new DocumentInstanceSectionDTO();
        dto.setId(section.getId());
        dto.setSectionValue(section.getSectionValue());
        dto.setDocumentInstanceDTO(documentOnlyConverter.toDTO(section.getDocumentInstance()));
        return dto;
    }

    /** Links the same sections to another message, e.g. a question's sources to its answer. */
    public List<MessageSection> copyMessageSections(List<MessageSection> sources, Message message) {
        List<MessageSection> copies = new ArrayList<>();
        Set<UUID> copied = new HashSet<>();
        for (MessageSection source : sources) {
            if (!copied.add(source.getSectionId())) {
                continue;
            }
            MessageSection copy = new MessageSection();
            copy.setMessage(message);
            copy.setSectionId(source.getSectionId());
            copy.setDocumentId(source.getDocumentId());
            copy.setSectionUrl(source.getSectionUrl());
            copy.setCompletionParticipant(source.getCompletionParticipant());
            copies.add(copy);
        }
        return messageSectionRepository.saveAll(copies);
    }

    public List<MessageSection> getMessageSectionsBySectionId(UUID sectionId) {
        return messageSectionRepository.findAllBySectionId(sectionId);
    }

    public Message createMessage(Message message) {

        message.setId(UUID.randomUUID());
        ProjectAgent agent = null;
        if (message.getThreadId() == null) {
            agent = projectAgentService.getAgentByProjectId(message.getProjectId());
            ChatThread chatThread = createThreadForMessage(Arrays.asList(securityUtils.getUserId(), agent.getUserId()), message.getProjectId());
            message.setThreadId(chatThread.getId());
        }


        // @CreatedBy and @LastModifiedBy are not set in the Message entity
        // because some messages will have custom values, so we need to control this manually
        if (message.getCreatedBy() == null) {
            message.setCreatedBy(securityUtils.getUserId());
            message.setUpdatedBy(securityUtils.getUserId());
        }

        if (message.getRole() == null) {
            message.setRole("user");
        }

        message = messageRepository.save(message);

        return message;
    }

    public ChatThread createThreadForMessage(List<UUID> memberIds, UUID projectId) {
        return this.createThreadForMessage(memberIds, projectId, null);
    }

    public ChatThread createThreadForMessage(List<UUID> memberIds, UUID projectId, @Nullable String threadName) {
        ChatThread chatThread = new ChatThread();

        chatThread.setName("Chat Thread");
        if (threadName != null) {
            chatThread.setName(threadName);
        }

        chatThread.setProjectId(projectId);

        for (UUID memberId : memberIds) {
            ChatThreadMember member = new ChatThreadMember();
            member.setUserId(memberId);
            member.setChatThread(chatThread);
            chatThread.getChatThreadMembers().add(member);
        }

        // Public thread rule: exactly 2 entries and exactly 1 is null
        long nullCount = memberIds.stream().filter(Objects::isNull).count();
        if (memberIds.size() == 2 && nullCount == 1) {
            chatThread.setPublicThread(true);
        }

        return chatThreadService.createChatThread(chatThread);
    }

    public Message updateMessageWithSections(Message message, List<MessageSection> messageSections) {
        message.setMessageSections(messageSections);
        message = messageRepository.save(message);

        return message;

    }


    public List<MessageSection> createMessageSections(List<DocumentInstanceSectionDTO> sections, Message message, Boolean completionParticipant) throws GendoxException {
        List<MessageSection> messageSections = new ArrayList<>();

        for (DocumentInstanceSectionDTO documentInstanceSection : sections) {
            MessageSection messageSection = new MessageSection();
            messageSection.setSectionId(documentInstanceSection.getId());
            messageSection.setMessage(message);
            messageSection.setCompletionParticipant(completionParticipant);
            messageSection.setDocumentId(documentInstanceSection.getDocumentInstanceDTO().getId());
            messageSections.add(messageSection);
        }

        messageSections = messageSectionRepository.saveAll(messageSections);


        return messageSections;
    }


    public MessageSection createMessageSection(MessageSection messageSection) throws GendoxException {
        messageSection = messageSectionRepository.save(messageSection);
        return messageSection;
    }

    public void deleteMessageSection(UUID sectionId) {
        List<MessageSection> messageSections = messageSectionRepository.findAllBySectionId(sectionId);
        messageSectionRepository.deleteAll(messageSections);
//        messageSectionRepository.deleteAllBySectionId(sectionId);
    }

    public  List<MessageMetadataDTO> getAllMessagesMetadataByMessageId(UUID messageId){

        return messageRepository.getMessageMetadataByMessageId(messageId);

    }


    /**
     * Get the previous messages from the same thread for a given message
     * The messages are ordered by creation date, the oldest message is the first in the list
     *
     * Note: the first message will be from the role 'user', so we drop all messages before that
     *
     * The logic of fetching previous messages is as follows:
     * - calculate the chunks of #messageHistoryLengthWindow messages
     * - fetch the latest 2 windows of messages from the thread,
     *
     * e.g message chunks of 25 messages -> |.....25......|......25......|.....10.....|
     * This will bring the latest 35 messages (25 + 10) and it is useful for the LLM API caching.
     *
     * @param message
     * @param messageHistoryLengthWindow it brings the latest 2 windows of messageHistoryLengthWindow messages
     * @return
     */
    public List<AiModelMessage> getPreviousMessages(Message message, int messageHistoryLengthWindow) {
        List<AiModelMessage> previousMessages = messageRepository.findPreviousMessages(message.getThreadId(), message.getCreatedAt(), messageHistoryLengthWindow);
        // from the latest 4 messages, the first one is the oldest
        Collections.reverse(previousMessages);


        //drop initial messages, until the 1st message is from role 'user'
        for (int i = 0; i < previousMessages.size(); i++) {
            if (previousMessages.get(i).getRole().equals("user")) {
                return previousMessages.subList(i, previousMessages.size());
            }
        }
        return new ArrayList<>();
    }

    @Transactional
    public void deleteMessageSectionsByDocumentId(UUID documentId) {
        if (documentId != null) {
            messageSectionRepository.deleteByDocumentId(documentId);
        }
    }


    public boolean areAllMessagesInThread(UUID threadId, List<UUID> messageIds) {
        if (threadId == null || messageIds == null || messageIds.isEmpty()) return false;

        // normalize (dedupe + remove nulls)
        Set<UUID> requested = messageIds.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        if (requested.isEmpty()) return false;

        // 1 query: returns only ids that belong to thread
        List<UUID> validList = messageRepository.findIdsByThreadIdAndIdIn(threadId, new ArrayList<>(requested));
        Set<UUID> valid = new HashSet<>(validList);

        // if all requested ids are in valid, then the client request is valid
        return valid.containsAll(requested);
    }

}
