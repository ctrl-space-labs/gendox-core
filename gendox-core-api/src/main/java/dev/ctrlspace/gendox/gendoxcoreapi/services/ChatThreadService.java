package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ChatThread;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ChatThreadDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ChatThreadLastMessageDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ChatThreadCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ChatThreadMemberRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ChatThreadRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.ChatThreadPredicates;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class ChatThreadService {

    private ChatThreadRepository chatThreadRepository;
    private ChatThreadMemberRepository chatThreadMemberRepository;


    @Autowired
    public ChatThreadService(ChatThreadRepository chatThreadRepository,
                             ChatThreadMemberRepository chatThreadMemberRepository) {
        this.chatThreadRepository = chatThreadRepository;
        this.chatThreadMemberRepository = chatThreadMemberRepository;
    }

    // getOptionalChatThreadById
    // getChatThreadById
    // getChatThreads (by criteria)
    // createChatThread

    public Optional<ChatThread> getOptionalById(UUID id) {
        return chatThreadRepository.findById(id);
    }

    public ChatThread getById(UUID id) throws GendoxException {
        return this.getOptionalById(id)
                .orElseThrow(() -> new GendoxException("CHAT_THREAD_NOT_FOUND", "Chat Thread not found with id: " + id, HttpStatus.NOT_FOUND));
    }

    public Page<ChatThreadLastMessageDTO> getAllChatThreads(ChatThreadCriteria criteria, Pageable pageable) throws GendoxException {
        if (pageable == null) {
            throw new GendoxException("Pageable cannot be null", "pageable.null", HttpStatus.BAD_REQUEST);
        }
        return chatThreadRepository.findAllThreads(ChatThreadPredicates.build(criteria), pageable);

    }

    public ChatThread createChatThread(ChatThread chatThread) {

        chatThread = chatThreadRepository.save(chatThread);
        chatThreadMemberRepository.saveAll(chatThread.getChatThreadMembers());
        return chatThread;
    }

    public ChatThread updateChatThread(UUID threadId, ChatThreadDTO chatThreadDTO) throws GendoxException {
        ChatThread existingChatThread = this.getById(threadId);
        existingChatThread.setName(chatThreadDTO.getName());

        return chatThreadRepository.save(existingChatThread);
    }

    public void deActiveChatThread(UUID threadId) throws GendoxException {
        ChatThread existingChatThread = this.getById(threadId);
        existingChatThread.setActive(false);
        chatThreadRepository.save(existingChatThread);
    }

    public void deleteChatThread(UUID threadId) throws GendoxException {
        this.deleteChatThreadMembersByThreadId(threadId);
        chatThreadRepository.deleteById(threadId);
    }

    public void deleteChatThreadMembersByThreadId(UUID threadId) {
        chatThreadMemberRepository.deleteByChatThread_Id(threadId);
    }

}
