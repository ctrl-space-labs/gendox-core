package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.MessageCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.MessageRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.MessageSectionRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.MessagePredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

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
                          ProjectAgentService projectAgentService){
        this.messageRepository = messageRepository;
        this.messageSectionRepository = messageSectionRepository;
        this.securityUtils = securityUtils;
        this.chatThreadService = chatThreadService;
        this.projectAgentService = projectAgentService;
    }


    public Page<Message> getAllMessagesByCriteria(MessageCriteria criteria, Pageable pageable) {
        return messageRepository.findAll(MessagePredicates.build(criteria), pageable);
    }

    public Message createMessage(Message message) {

        message.setId(UUID.randomUUID());
        ProjectAgent agent = null;
        if (message.getThreadId() == null) {
            agent = projectAgentService.getAgentByProjectId(message.getProjectId());
            ChatThread chatThread = createThreadForMessage(securityUtils.getUserId(), agent.getUserId(), message.getProjectId());
            message.setThreadId(chatThread.getId());
        }


        // @CreatedBy and @LastModifiedBy are not set in the Message entity
        // because some messages will have custom values, so we need to control this manually
        if (message.getCreatedBy() == null) {
            message.setCreatedBy(securityUtils.getUserId());
            message.setUpdatedBy(securityUtils.getUserId());
        }

        message = messageRepository.save(message);

        return message;
    }

    private ChatThread createThreadForMessage(UUID userId, UUID agentId, UUID projectId) {

        // create the members
        ChatThreadMember userMember = new ChatThreadMember();
        userMember.setUserId(userId);
        ChatThreadMember agentMember = new ChatThreadMember();
        agentMember.setUserId(agentId);

        // create the chat thread
        ChatThread chatThread = new ChatThread();
        chatThread.setName("Chat Thread");
        chatThread.setProjectId(projectId);
        // message from anonymous user
        if (userId == null) {
            chatThread.setPublicThread(true);
        }

        // connect the objects
        chatThread.getChatThreadMembers().add(userMember);
        chatThread.getChatThreadMembers().add(agentMember);
        userMember.setChatThread(chatThread);
        agentMember.setChatThread(chatThread);

        return chatThreadService.create(chatThread);

    }

    public Message updateMessageWithSections(Message message, List<MessageSection> messageSections){
        message.setMessageSections(messageSections);
        message = messageRepository.save(message);

        return message;

    }



    public List<MessageSection> createMessageSections(List<DocumentInstanceSection> sections, Message message) throws GendoxException{
        List<MessageSection> messageSections = new ArrayList<>();

        for (DocumentInstanceSection documentInstanceSection: sections){
            MessageSection messageSection = new MessageSection();
            messageSection.setSectionId(documentInstanceSection.getId());
            messageSection.setMessage(message);
            messageSection.setDocumentId(documentInstanceSection.getDocumentInstance().getId());
            messageSections.add(messageSection);
        }

        messageSections = messageSectionRepository.saveAll(messageSections);


        return messageSections;
    }



    public MessageSection createMessageSection(MessageSection messageSection) throws GendoxException {
        messageSection = messageSectionRepository.save(messageSection);
        return messageSection;
    }

    public void deleteMessageSection(UUID sectionId){
        messageSectionRepository.deleteAllBySectionId(sectionId);    }

    /**
     * Get the previous messages from the same thread for a given message
     * The messages are ordered by creation date, the oldest message is the first in the list
     *
     * @param message
     * @param size
     * @return
     */
    public List<AiModelMessage> getPreviousMessages(Message message, int size) {
        List<AiModelMessage> previousMessages = messageRepository.findPreviousMessages(message.getThreadId(), message.getCreatedAt(), size);
        previousMessages.forEach(m -> m.setRole(completionRole(m.getRole())));
        // from the latest 4 messages, the first one is the oldest
        Collections.reverse(previousMessages);
        return previousMessages;
    }

    /**
     * Transform the role of the message to the one expected by the AI model provider
     * eg. GENDOX_USER (or null) -> user
     * eg. GENDOX_AGENT -> assistant
     *
     * @param role
     * @return
     */
    public String completionRole(String role) {
        if (role == null || "GENDOX_USER".equals(role)) {
            return "user";
        }
        if ("GENDOX_AGENT".equals(role)) {
            return "assistant";
        }
        return role;
    }
}
