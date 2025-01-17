package dev.ctrlspace.gendox.gendoxcoreapi.repositories;


import com.querydsl.core.Tuple;
import com.querydsl.core.types.Expression;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Predicate;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.PathBuilder;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ChatThread;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QChatThread;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ChatThreadLastMessageDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
@Transactional(readOnly = true)
public class ChatThreadRepositoryCustomImpl implements ChatThreadRepositoryCustom {


    private JPAQueryFactory queryFactory;
    private ChatThreadRepository chatThreadRepository;
    private MessageRepository messageRepository;

    @Autowired
    public ChatThreadRepositoryCustomImpl(JPAQueryFactory queryFactory,
                                          @Lazy ChatThreadRepository chatThreadRepository,
                                          MessageRepository messageRepository) {
        this.queryFactory = queryFactory;
        this.chatThreadRepository = chatThreadRepository;
        this.messageRepository = messageRepository;
    }

    /**
     * Custom implementation to join with messages to order them by the latest message
     *
     * @param criteriaPredicate
     * @param pageable
     * @return
     */
    @Override
    public Page<ChatThreadLastMessageDTO> findAllThreads(Predicate criteriaPredicate, Pageable pageable) {
        QChatThread qChatThread = QChatThread.chatThread;
        QMessage qMessage = QMessage.message;

        // Step 1: Fetch thread IDs with pagination and sorting
        List<UUID> threadIds = queryFactory
                .select(qChatThread.id)
                .from(qChatThread)
                .leftJoin(qMessage).on(qMessage.threadId.eq(qChatThread.id))
                .where(criteriaPredicate)
                .groupBy(qChatThread.id)
                .orderBy(buildOrderSpecifiers(pageable, qChatThread, qMessage))
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        if (threadIds.isEmpty()) {
            return new PageImpl<>(List.of(), pageable, 0);
        }

        // Step 2: Fetch full thread details with members using EntityGraph
        List<ChatThread> threads = chatThreadRepository.findByIdIn(threadIds);

        // Step 3: Fetch the latest message for each thread
        List<Message> latestMessages = messageRepository.findLatestMessagesForThreads(threadIds);

        // Map latest messages by threadId
//        Map<UUID, Tuple> latestMessageMap = latestMessages.stream()
//                .collect(Collectors.toMap(tuple -> tuple.get(qMessage.threadId), tuple -> tuple));
        Map<UUID, Message> latestMessageMap = latestMessages.stream()
                .collect(Collectors.toMap(message -> message.getThreadId(), message -> message));

        // Step 4: Combine data into DTOs
        List<ChatThreadLastMessageDTO> dtos = threads.stream().map(thread -> {
            Message latestMessage = latestMessageMap.get(thread.getId());
            return new ChatThreadLastMessageDTO(
                    thread.getId(),
                    thread.getName(),
                    thread.getProjectId(),
                    thread.getCreatedAt(),
                    thread.getUpdatedAt(),
                    thread.getCreatedBy(),
                    thread.getUpdatedBy(),
                    thread.getActive(),
                    thread.getChatThreadMembers(),
                    thread.getPublicThread(),
                    latestMessage != null ? latestMessage.getValue() : null,
                    latestMessage != null ? latestMessage.getCreatedAt() : null
            );
        }).collect(Collectors.toList());

        // Step 5: Fetch total count for pagination
        long total = queryFactory
                .select(qChatThread.id.countDistinct())
                .from(qChatThread)
                .leftJoin(qMessage).on(qMessage.threadId.eq(qChatThread.id))
                .where(criteriaPredicate)
                .fetchOne();

        return new PageImpl<>(dtos, pageable, total);
    }

    private OrderSpecifier<?>[] buildOrderSpecifiers(Pageable pageable, QChatThread qChatThread, QMessage qMessage) {
        if (pageable.getSort().isEmpty()) {
            // Default sorting: latest message first
            return new OrderSpecifier[]{qMessage.createdAt.max().desc()};
        }

        return pageable.getSort().stream().map(order -> {
            Order direction = order.isAscending() ? Order.ASC : Order.DESC;
            if ("latestMessage".equals(order.getProperty()) || "message.createdAt".equals(order.getProperty())) {
                return new OrderSpecifier<>(direction, qMessage.createdAt.max());
            }
            PathBuilder<ChatThread> entityPath = new PathBuilder<>(ChatThread.class, "chatThread");
            // We assume the underlying property is Comparable
            @SuppressWarnings("unchecked")
            Expression<? extends Comparable> sortExpression = Expressions.path(
                    Comparable.class,
                    entityPath,
                    order.getProperty()
            );

            return new OrderSpecifier<>(direction, sortExpression);
        }).toArray(OrderSpecifier[]::new);
    }
}