package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QChatThread;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ChatThreadCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.MessageCriteria;

import java.util.List;
import java.util.UUID;

public class MessagePredicates {

    private static QMessage qMessage = QMessage.message;

    public static Predicate build(MessageCriteria criteria) {
        return ExpressionUtils.allOf(
                threadId(criteria.getThreadId())
        );
    }

    private static Predicate threadId(UUID threadId) {
        if (threadId == null) {
            return null;
        }
        return qMessage.threadId.eq(threadId);
    }

}
