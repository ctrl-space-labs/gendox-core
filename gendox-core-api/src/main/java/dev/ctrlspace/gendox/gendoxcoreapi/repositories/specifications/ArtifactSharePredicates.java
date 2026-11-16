package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.util.StringUtils;
import com.querydsl.jpa.JPAExpressions;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QArtifactShare;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QProject;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ArtifactShareCriteria;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * The shares one reader may open ("Shared with you"). Every condition that decides who sees what fails closed:
 * without the reader, the organization or the moment, the list matches nothing, never everything.
 */
public class ArtifactSharePredicates {
    private static QArtifactShare qArtifactShare = QArtifactShare.artifactShare;
    private static QProject qProject = QProject.project;

    public static Predicate build(ArtifactShareCriteria criteria) {
        return ExpressionUtils.allOf(
                organizationId(criteria.getOrganizationId()),
                projectId(criteria.getProjectId()),
                reader(criteria.getReaderId(), criteria.getReaderProjectIds()),
                activeAt(criteria.getActiveAt()),
                search(criteria.getSearch()),
                artifactType(criteria.getArtifactType())
        );
    }

    /** A list never spans organizations: only artifacts of the organization's projects. */
    private static Predicate organizationId(UUID organizationId) {
        if (organizationId == null) {
            return Expressions.FALSE.isTrue();
        }
        return qArtifactShare.artifact.projectId.in(
                JPAExpressions.select(qProject.id)
                        .from(qProject)
                        .where(qProject.organizationId.eq(organizationId)));
    }

    /** One agent's list; none for the organization's. */
    private static Predicate projectId(UUID projectId) {
        if (projectId == null) {
            return null;
        }
        return qArtifactShare.artifact.projectId.eq(projectId);
    }

    /**
     * Shared with the reader by name, or with a whole project the reader is a member of; never the reader's own
     * shares, which they see in the artifact itself.
     */
    private static Predicate reader(UUID readerId, List<UUID> readerProjectIds) {
        if (readerId == null) {
            return Expressions.FALSE.isTrue();
        }
        Predicate withReader = qArtifactShare.sharedWithUserId.eq(readerId);
        Predicate withReadersProject = readerProjectIds == null || readerProjectIds.isEmpty()
                ? null
                : qArtifactShare.sharedWithUserId.isNull().and(qArtifactShare.artifact.projectId.in(readerProjectIds));

        return ExpressionUtils.allOf(
                ExpressionUtils.anyOf(withReader, withReadersProject),
                qArtifactShare.createdBy.ne(readerId));
    }

    /** Not revoked, and not past its end at that moment. */
    private static Predicate activeAt(Instant activeAt) {
        if (activeAt == null) {
            return Expressions.FALSE.isTrue();
        }
        return qArtifactShare.revokedAt.isNull()
                .and(qArtifactShare.expiresAt.isNull().or(qArtifactShare.expiresAt.gt(activeAt)));
    }

    private static Predicate search(String search) {
        if (StringUtils.isNullOrEmpty(search)) {
            return null;
        }
        return qArtifactShare.artifact.title.containsIgnoreCase(search.trim());
    }

    private static Predicate artifactType(String artifactType) {
        if (StringUtils.isNullOrEmpty(artifactType)) {
            return null;
        }
        return qArtifactShare.artifact.artifactType.name.eq(artifactType.trim().toUpperCase(Locale.ROOT));
    }
}