package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import com.querydsl.jpa.JPAExpressions;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QChatThread;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ChatThreadCriteria;

import java.util.List;
import java.util.UUID;

public class ChatThreadPredicates {

    private static QChatThread qChatThread = QChatThread.chatThread;
    private static QMessage qMessage = QMessage.message;

    public static Predicate build(ChatThreadCriteria criteria) {
        return ExpressionUtils.allOf(
                projectIdIn(criteria.getProjectIdIn()),
                memberIdIn(criteria.getMemberIdIn()),
                threadIdIn(criteria.getThreadIdIn()),
                isPublicThread(criteria.getIsPublicThread()),
                isActive(true), // Always filter for active chat threads
                minMessages(criteria.getMinMessages())

        );
    }

    private static Predicate isActive(Boolean isActive) {
        if (isActive == null) {
            return null;
        }
        return qChatThread.isActive.eq(isActive);
    }

    public static Predicate minMessages(Integer minMessages) {
        if (minMessages == null) {
            return null;
        }

        // We use a subquery to select only threadIds that have a count of messages > minMessages
        return qChatThread.id.in(
                JPAExpressions.select(qMessage.threadId)
                        .from(qMessage)
                        .groupBy(qMessage.threadId)
                        .having(qMessage.threadId.count().goe(minMessages))
        );
    }

    private static Predicate threadIdIn(List<UUID> threadIdIn) {
        if (threadIdIn == null) {
            return null;
        }
        return qChatThread.id.in(threadIdIn);
    }

    private static Predicate isPublicThread(Boolean isPublicThread) {
        if (isPublicThread == null) {
            return null;
        }
        return qChatThread.publicThread.eq(isPublicThread);
    }

    private static Predicate projectIdIn(List<UUID> projectIdIn) {
        if (projectIdIn == null) {
            return null;
        }
        return qChatThread.projectId.in(projectIdIn);
    }

    private static Predicate memberIdIn(List<UUID> memberIdIn) {
        if (memberIdIn == null) {
            return null;
        }
        return qChatThread.chatThreadMembers.any().userId.in(memberIdIn);
    }
}
