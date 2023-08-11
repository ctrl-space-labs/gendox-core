package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import dev.ctrlspace.gendox.gendoxcoreapi.model.QUser;

public class UserPredicate {

    private static QUser user = QUser.user;

//    public static Predicate build(UserCriteria criteria) {
//        return ExpressionUtils.allOf(
//                email(criteria.getEmail()),
//                organizationId(criteria.getOrganizationId()),
//                projectId(criteria.getProjectId()),
//                roleName(criteria.getOrgRoleName())
//        );
//    }
}
