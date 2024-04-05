package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QChatThread;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ChatThreadCriteria;

import java.util.List;
import java.util.UUID;

public class ChatThreadPredicates {

    private static QChatThread qChatThread = QChatThread.chatThread;

    public static Predicate build(ChatThreadCriteria criteria) {
        return ExpressionUtils.allOf(
                projectIdIn(criteria.getProjectIdIn()),
                memberIdIn(criteria.getMemberIdIn())
        );
    }

    private static Predicate projectIdIn(List<UUID> projectIdIn) {
        if (projectIdIn == null || projectIdIn.isEmpty()) {
            return null;
        }
        return qChatThread.projectId.in(projectIdIn);
    }

    private static Predicate memberIdIn(List<UUID> memberIdIn) {
        if (memberIdIn == null || memberIdIn.isEmpty()) {
            return null;
        }
        return qChatThread.chatThreadMembers.any().userId.in(memberIdIn);
    }
}
