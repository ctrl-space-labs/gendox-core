package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QInvitation;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.InvitationCriteria;

import java.util.UUID;

public class InvitationPredicate {

    private static QInvitation qInvitation = QInvitation.invitation;

    public static Predicate build(InvitationCriteria criteria) {
        return ExpressionUtils.allOf(
                email(criteria.getEmail()),
                token(criteria.getToken()),
                organizationId(criteria.getOrganizationId()),
                inviterUserId(criteria.getInviterUserId()),
                status(criteria.getStatusName())
        );
    }

    private static Predicate email(String email) {
        if (email == null) {
            return null;
        }
        return qInvitation.inviteeEmail.eq(email);
    }

    private static Predicate token(String token) {
        if (token == null) {
            return null;
        }
        return qInvitation.token.eq(token);
    }

    private static Predicate organizationId(String organizationId) {
        if (organizationId == null) {
            return null;
        }
        return qInvitation.organizationId.eq(UUID.fromString(organizationId));
    }

    private static Predicate inviterUserId(UUID inviterUserId) {
        if (inviterUserId == null) {
            return null;
        }
        return qInvitation.inviterUserId.eq(inviterUserId);
    }

    private static Predicate status(String statusName) {
        if (statusName == null) {
            return null;
        }
        return qInvitation.statusType.name.eq(statusName);
    }




}
