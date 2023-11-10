package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import com.querydsl.core.util.StringUtils;
import com.querydsl.jpa.JPAExpressions;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QDocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QProject;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QProjectDocument;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TimePeriodDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentInstanceSectionCriteria;

import java.time.Instant;
import java.util.UUID;

public class DocumentInstanceSectionPredicates {

    private static QDocumentInstanceSection qDocumentInstanceSection = QDocumentInstanceSection.documentInstanceSection;
    private static QProjectDocument qProjectDocument = QProjectDocument.projectDocument;

    public static Predicate build(DocumentInstanceSectionCriteria criteria) {
        return ExpressionUtils.allOf(
                projectId(criteria.getProjectId()),
                createdBetween(criteria.getCreatedBetween()),
                updatedBetween(criteria.getUpdatedBetween()),
                documentId(criteria.getDocumentId())
        );
    }

    private static Predicate updatedBetween(TimePeriodDTO updatedBetween) {
        if (updatedBetween == null) {
            return null;
        }
        return qDocumentInstanceSection.updatedAt.between(updatedBetween.from(), updatedBetween.to());
    }

    private static Predicate createdBetween(TimePeriodDTO createdBetween) {
        if (createdBetween == null) {
            return null;
        }

        return qDocumentInstanceSection.createdAt.between(createdBetween.from(), createdBetween.to());
    }

    private static Predicate documentId(String documentId) {
        if (StringUtils.isNullOrEmpty(documentId)){
            return null;
        }
        return qDocumentInstanceSection.documentInstance.id.eq(UUID.fromString(documentId));
    }

    private static Predicate projectId(String projectId) {
        if (StringUtils.isNullOrEmpty(projectId)) {
            return null;
        }

        // Assuming you have a relationship between DocumentInstance and ProjectDocument
        return qDocumentInstanceSection.documentInstance
                .id.in(
                        JPAExpressions
                                .select(qProjectDocument.documentId)
                                .from(qProjectDocument)
                                .where(qProjectDocument.project.id.eq(UUID.fromString(projectId))
                                ));
    }


}
