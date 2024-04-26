package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ChatThread;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

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
//    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedProjectIdFromPathVariable')")
    @GetMapping("threads/{id}")
    @Operation(summary = "Get Chat Thread by ID",
            description = "Retrieve the Chat Thread details by its unique ID. The user must have the appropriate permissions to access this.")

    public ChatThread getById(@PathVariable UUID id) throws GendoxException {
        return chatThreadService.getById(id);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedProjectsFromRequestParams')")
    @GetMapping("threads")
    @Operation(summary = "Get Chat Threads by criteria",
            description = "Retrieve the Chat Threads details by criteria. The supported criteria are:" +
                    "- the list of projects that the threads belong to <br>" +
                    "- the members participated in the Chat Thread <br>" +
                    "<br>" +
                    "The user must have the appropriate permissions to access this.")
    public Page<ChatThread> getAllChatThreads(@Valid ChatThreadCriteria criteria, Pageable pageable) throws GendoxException {
        // Override the memberIds with the current user's ID
        criteria.getMemberIdIn().add(securityUtils.getUserId());
        if (pageable == null) {
            pageable = PageRequest.of(0, 100);
        }
        if (pageable.getPageSize() > 100) {
            throw new GendoxException("MAX_PAGE_SIZE_EXCEED", "Page size can't be more than 100", HttpStatus.BAD_REQUEST);
        }
        return chatThreadService.getAllChatThreads(criteria, pageable);
    }


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


}
