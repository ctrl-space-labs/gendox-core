package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.authentication.GendoxAuthenticationToken;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ChatThread;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ChatThreadDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ChatThreadLastMessageDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.MessageMetadataDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ChatThreadCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.MessageCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ChatThreadService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.MessageService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.ArrayList;
import java.util.UUID;

@RestController
public class ChatThreadController {

    private ChatThreadService chatThreadService;
    private SecurityUtils securityUtils;
    private MessageService messageService;


    @Autowired
    public ChatThreadController(ChatThreadService chatThreadService,
                                SecurityUtils securityUtils,
                                MessageService messageService) {
        this.chatThreadService = chatThreadService;
        this.securityUtils = securityUtils;
        this.messageService = messageService;
    }

    //    TODO add authorization checks
    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedThreadIdFromPathVariable')")
    @GetMapping("threads/{threadId}")
    @Operation(summary = "Get Chat Thread by ID",
            description = "Retrieve the Chat Thread details by its unique ID. The user must have the appropriate permissions to access this.")

    public ChatThread getById(@PathVariable UUID threadId) throws GendoxException {

        return chatThreadService.getById(threadId);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedProjectsFromRequestParams') " +
            "|| isAnonymous()")
    @GetMapping("threads")
    @Operation(summary = "Get Chat Threads by criteria",
            description = "Retrieve the Chat Threads details by criteria. The supported criteria are:" +
                    "- the list of projects that the threads belong to <br>" +
                    "- the members participated in the Chat Thread <br>" +
                    "<br>" +
                    "The user must have the appropriate permissions to access this.")
    public Page<ChatThreadLastMessageDTO> getAllChatThreads(@Valid ChatThreadCriteria criteria, Pageable pageable, Authentication authentication) throws GendoxException {

        handleCriteriaForAuthenticatedUser(criteria, authentication);

        handleCriteriaForAnonymousUser(criteria, authentication);

        if (pageable == null) {
            pageable = PageRequest.of(0, 100);
        }
        if (pageable.getPageSize() > 100) {
            throw new GendoxException("MAX_PAGE_SIZE_EXCEED", "Page size can't be more than 100", HttpStatus.BAD_REQUEST);
        }
        return chatThreadService.getAllChatThreads(criteria, pageable);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedThreadIdFromPathVariable') " +
            "|| @securityUtils.isPublicThread(#threadId)")
    @GetMapping("threads/{threadId}/messages")
    @Operation(summary = "Get the messages in a Thread",
            description = "Retrieve the messages from a thread. Pagination is supported. The user should have the rights to access this chat.")

    public Page<Message> getMessagesById(@PathVariable UUID threadId, MessageCriteria criteria, Pageable pageable) throws GendoxException {


        criteria.setThreadId(threadId);
        if (pageable == null) {
            pageable = PageRequest.of(0, 100);
        }
        // TODO add default sorting by message createdAt, desc
        if (pageable.getPageSize() > 100) {
            throw new GendoxException("MAX_PAGE_SIZE_EXCEED", "Page size can't be more than 100", HttpStatus.BAD_REQUEST);
        }
        return messageService.getAllMessagesByCriteria(criteria, pageable);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedThreadIdFromPathVariable')")
    @GetMapping("threads/{threadId}/message-metadata/{messageId}")
    @Operation(summary = "Get the messages metadata in a Thread",
            description = "Retrieve the messages metadata from a thread. Pagination is supported. The user should have the rights to access this chat.")
    public List<MessageMetadataDTO> getThreadMessageMetadataByMessageId(@PathVariable UUID messageId) throws GendoxException {

        return messageService.getAllMessagesMetadataByMessageId(messageId);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedThreadIdFromPathVariable')")
    @PutMapping("/organizations/{organizationId}/threads/{threadId}")
    public ChatThread updateChatThread(@PathVariable UUID organizationId, @PathVariable UUID threadId, @RequestBody ChatThreadDTO chatThreadDTO) throws GendoxException {

        return chatThreadService.updateChatThread(threadId, chatThreadDTO);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedThreadIdFromPathVariable')")
    @DeleteMapping("/organizations/{organizationId}/threads/{threadId}")
    public void deActiveChatThread(@PathVariable UUID organizationId, @PathVariable UUID threadId) throws GendoxException {
        chatThreadService.deActiveChatThread(threadId);
    }

    private void handleCriteriaForAuthenticatedUser(ChatThreadCriteria criteria, Authentication authentication) {
        // Override the memberIds with the current user's ID
        if (authentication instanceof GendoxAuthenticationToken) {
            criteria.setMemberIdIn(new ArrayList<>());
            criteria.getMemberIdIn().add(securityUtils.getUserId());
        }
    }

    private static void handleCriteriaForAnonymousUser(ChatThreadCriteria criteria, Authentication authentication) throws GendoxException {
        // if it is anonymous, gets only the public threads
        if (!(authentication instanceof GendoxAuthenticationToken)) {
            criteria.setIsPublicThread(true);
        }

        // if it is anonymous, must provide specific thread IDs
        if ((!(authentication instanceof GendoxAuthenticationToken))
                && criteria.getThreadIdIn() == null) {
            // it will return an empty list
            criteria.setThreadIdIn(new ArrayList<>());
        }
    }


}
