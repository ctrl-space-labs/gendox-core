package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.util.StringUtils;
import com.querydsl.jpa.JPAExpressions;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QArtifact;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QArtifactMember;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QChatThread;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QProjectMember;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ArtifactCriteria;

import java.util.Locale;
import java.util.UUID;

public class ArtifactPredicates {
    private static QArtifact qArtifact = QArtifact.artifact;
    private static QArtifactMember qArtifactMember = QArtifactMember.artifactMember;
    private static QChatThread qChatThread = QChatThread.chatThread;
    private static QProjectMember qProjectMember = QProjectMember.projectMember;

    public static Predicate build(ArtifactCriteria criteria) {
        return ExpressionUtils.allOf(
                projectId(criteria.getProjectId()),
                Boolean.TRUE.equals(criteria.getSharedWithMe())
                        ? sharedWith(criteria.getUserId(), criteria.getProjectId())
                        : ownedBy(criteria.getUserId()),
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
     * The user's own artifacts. One whose conversation was deleted stays only while others can still open it;
     * one that was only the owner's goes with its conversation. Without a user it matches nothing, never everything.
     */
    private static Predicate ownedBy(UUID userId) {
        if (userId == null) {
            return Expressions.FALSE.isTrue();
        }
        return qArtifact.ownerId.eq(userId).and(
                qArtifact.threadId.in(JPAExpressions.select(qChatThread.id)
                                .from(qChatThread)
                                .where(qChatThread.isActive.isTrue()))
                        .or(isShared()));
    }

    /**
     * The others' artifacts the user has a role on, through general access or an invitation, while a member of the
     * agent: the same rule as ArtifactAccessService, for a whole page at once. Without a user it matches nothing.
     */
    private static Predicate sharedWith(UUID userId, UUID projectId) {
        if (userId == null || projectId == null) {
            return Expressions.FALSE.isTrue();
        }
        return qArtifact.ownerId.isNull().or(qArtifact.ownerId.ne(userId))
                .and(JPAExpressions.selectOne()
                        .from(qProjectMember)
                        .where(qProjectMember.project.id.eq(projectId), qProjectMember.user.id.eq(userId))
                        .exists())
                .and(qArtifact.generalAccessRole.isNotNull()
                        .or(JPAExpressions.selectOne()
                                .from(qArtifactMember)
                                .where(qArtifactMember.artifactId.eq(qArtifact.id), qArtifactMember.userId.eq(userId))
                                .exists()));
    }

    /** Someone besides the owner can open it: the agent, an invited member, or anyone through its public link. */
    private static Predicate isShared() {
        return qArtifact.generalAccessRole.isNotNull()
                .or(qArtifact.publicId.isNotNull())
                .or(JPAExpressions.selectOne()
                        .from(qArtifactMember)
                        .where(qArtifactMember.artifactId.eq(qArtifact.id))
                        .exists());
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