package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceSectionDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.MessageMetadataDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.MessageCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.MessageRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.MessageSectionRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.MessagePredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import jakarta.annotation.Nullable;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class MessageService {

    private MessageRepository messageRepository;

    private MessageSectionRepository messageSectionRepository;
    private SecurityUtils securityUtils;
    private ChatThreadService chatThreadService;
    private ProjectAgentService projectAgentService;

    @Autowired
    public MessageService(MessageRepository messageRepository,
                          MessageSectionRepository messageSectionRepository,
                          SecurityUtils securityUtils,
                          ChatThreadService chatThreadService,
                          ProjectAgentService projectAgentService) {
        this.messageRepository = messageRepository;
        this.messageSectionRepository = messageSectionRepository;
        this.securityUtils = securityUtils;
        this.chatThreadService = chatThreadService;
        this.projectAgentService = projectAgentService;
    }


    public Page<Message> getAllMessagesByCriteria(MessageCriteria criteria, Pageable pageable) {
        return messageRepository.findAll(MessagePredicates.build(criteria), pageable);
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

}
