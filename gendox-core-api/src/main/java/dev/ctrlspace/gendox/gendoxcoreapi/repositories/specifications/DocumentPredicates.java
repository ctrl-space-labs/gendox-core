package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QDocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentCriteria;



import java.util.UUID;


public class DocumentPredicates {

    private static QDocumentInstance documentInstance = QDocumentInstance.documentInstance;

    public static Predicate build(DocumentCriteria criteria){
        return ExpressionUtils.allOf(
                organizationId(criteria.getOrganizationId())
               // userId(criteria.getUserId())
        );
    }

    private static Predicate organizationId(String organizationId){
        if (organizationId == null) {
            return null;
        }
        return documentInstance.organizationId.eq(UUID.fromString(organizationId));
    }
//    private static Predicate userId(String userId) {
//        if (userId == null) {
//            return null;
//        }
//        return documentInstance.userId.eq(UUID.fromString(userId));
//    }

}
