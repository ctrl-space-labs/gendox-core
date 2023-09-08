package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import com.querydsl.core.util.StringUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QProjectMember;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ProjectMemberCriteria;

import java.util.UUID;


public class ProjectMemberPredicates {

    private static QProjectMember qProjectMember = QProjectMember.projectMember;

    public static Predicate build(ProjectMemberCriteria criteria) {
        return ExpressionUtils.allOf(
               projectId(criteria.getProjectId())
               // userId(criteria.getUserId())
        );
    }

    private static Predicate projectId(String projectId){
        if (StringUtils.isNullOrEmpty(projectId)) {
            return null;
        }
        return qProjectMember.project.id.eq(UUID.fromString(projectId));
    }

//    private static Predicate userId(String userId) {
//        if (StringUtils.isNullOrEmpty(userId)) {
//            return null;
//        }
//        return qProjectMember.projectMembers.any().user.id.eq(UUID.fromString(userId));
//    }


}
