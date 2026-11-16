package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.util.StringUtils;
import com.querydsl.jpa.JPAExpressions;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QArtifact;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QChatThreadMember;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ArtifactCriteria;

import java.util.Locale;
import java.util.UUID;

public class ArtifactPredicates {
    private static QArtifact qArtifact = QArtifact.artifact;
    private static QChatThreadMember qChatThreadMember = QChatThreadMember.chatThreadMember;

    public static Predicate build(ArtifactCriteria criteria) {
        return ExpressionUtils.allOf(
                projectId(criteria.getProjectId()),
                memberId(criteria.getMemberId()),
                search(criteria.getSearch()),
                artifactType(criteria.getArtifactType())
        );
    }

    /** A list never spans projects: without one it matches nothing. */
    private static Predicate projectId(UUID projectId) {
        if (projectId == null) {
            return Expressions.FALSE.isTrue();
        }
        return qArtifact.projectId.eq(projectId);
    }

    /**
     * Only the artifacts of conversations the user is a member of. Without a user it matches nothing, never
     * everything: a conversation is personal, and so are its artifacts.
     */
    private static Predicate memberId(UUID memberId) {
        if (memberId == null) {
            return Expressions.FALSE.isTrue();
        }
        return qArtifact.threadId.in(
                JPAExpressions.select(qChatThreadMember.chatThread.id)
                        .from(qChatThreadMember)
                        .where(qChatThreadMember.userId.eq(memberId)));
    }

    private static Predicate search(String search) {
        if (StringUtils.isNullOrEmpty(search)) {
            return null;
        }
        return qArtifact.title.containsIgnoreCase(search.trim());
    }

    private static Predicate artifactType(String artifactType) {
        if (StringUtils.isNullOrEmpty(artifactType)) {
            return null;
        }
        return qArtifact.artifactType.name.eq(artifactType.trim().toUpperCase(Locale.ROOT));
    }
}