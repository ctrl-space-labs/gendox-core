package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import com.querydsl.core.util.StringUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QDocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QProject;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QProjectDocument;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentInstanceSectionCriteria;

import java.util.UUID;

public class DocumentInstanceSectionPredicates {

    private static QDocumentInstanceSection qDocumentInstanceSection = QDocumentInstanceSection.documentInstanceSection;
    private static QProject qProject = QProject.project;

    public static Predicate build(DocumentInstanceSectionCriteria criteria) {
        return ExpressionUtils.allOf(
                projectId(criteria.getProjectId()),
                documentId(criteria.getDocumentId())
        );
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
        return null;
//                qProject.projectDocuments.any().documentId.eq(UUID.fromString(projectId));
    }
}
