package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.StringExpression;
import com.querydsl.core.util.StringUtils;
import com.querydsl.jpa.JPAExpressions;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QDocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QProjectDocument;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TimePeriodDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentCriteria;


import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;


public class DocumentPredicates {

    private static QDocumentInstance qDocumentInstance = QDocumentInstance.documentInstance;
    private static QProjectDocument qProjectDocument = QProjectDocument.projectDocument;


    public static Predicate build(DocumentCriteria criteria) {
        return ExpressionUtils.allOf(
                organizationsId(criteria.getOrganizationId()),
                projectId(criteria.getProjectId()),
                documentNameContains(criteria.getDocumentNameContains()),
                createdBetween(criteria.getCreatedBetween()),
                updatedBetween(criteria.getUpdatedBetween()),
                documentInstanceId(criteria.getDocumentInstanceId()),
                documentInstanceIds(criteria.getDocumentInstanceIds())
        );
    }

    private static Predicate documentNameContains(String documentNameContains) {
        if (StringUtils.isNullOrEmpty(documentNameContains)) {
            return null;
        }
        //title or remote url contains
        // if there are a lot of files a trigram index could help, needs investigation
        StringExpression normalizedTitle =
                Expressions.stringTemplate(
                        "cast(function('unaccent', lower({0})) as string)",
                        qDocumentInstance.title
                );

        StringExpression normalizedUrl =
                Expressions.stringTemplate(
                        "cast(function('unaccent', lower({0})) as string)",
                        qDocumentInstance.remoteUrl
                );

        String pattern = "%" + documentNameContains + "%";
        StringExpression normalizedPattern =
                Expressions.stringTemplate(
                        "cast(function('unaccent', lower({0})) as string)",
                        Expressions.constant(pattern)
                );

        BooleanExpression titleExpr = normalizedTitle.like(normalizedPattern);
        BooleanExpression urlExpr   = normalizedUrl.like(normalizedPattern);

        return titleExpr.or(urlExpr);
    }

    private static Predicate updatedBetween(TimePeriodDTO updatedBetween) {
        if (updatedBetween == null) {
            return null;
        }
        return qDocumentInstance.updatedAt.between(updatedBetween.from(), updatedBetween.to());
    }

    private static Predicate createdBetween(TimePeriodDTO createdBetween) {
        if (createdBetween == null) {
            return null;
        }

        return qDocumentInstance.createdAt.between(createdBetween.from(), createdBetween.to());
    }

    private static Predicate organizationsId(String organizationId) {
        if (StringUtils.isNullOrEmpty(organizationId)) {
            return null;
        }
        return qDocumentInstance.organizationId.eq(UUID.fromString(organizationId));

    }

    private static Predicate projectId(String projectId) {
        if (StringUtils.isNullOrEmpty(projectId)) {
            return null;
        }

        // Assuming you have a relationship between DocumentInstance and ProjectDocument
        return qDocumentInstance
                .id.in(
                        JPAExpressions
                                .select(qProjectDocument.documentId)
                                .from(qProjectDocument)
                                .where(qProjectDocument.project.id.eq(UUID.fromString(projectId))
                                ));
    }

    private static Predicate documentInstanceId(String documentInstanceId) {
        if (StringUtils.isNullOrEmpty(documentInstanceId)) {
            return null;
        }
        return qDocumentInstance.id.eq(UUID.fromString(documentInstanceId));
    }

    private static Predicate documentInstanceIds(List<String> documentInstanceIds) {
        if (documentInstanceIds == null || documentInstanceIds.isEmpty()) {
            return null;
        }
        List<UUID> parsedIds = documentInstanceIds
                .stream()
                .map(UUID::fromString)
                .collect(Collectors.toList());

        return qDocumentInstance.id.in(parsedIds);
    }

}
