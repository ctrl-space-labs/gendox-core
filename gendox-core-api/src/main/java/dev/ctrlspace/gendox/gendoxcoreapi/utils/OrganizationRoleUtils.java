package dev.ctrlspace.gendox.gendoxcoreapi.utils;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.OrganizationRolesConstants;

public class OrganizationRoleUtils {
    public static int getRoleLevel(String roleName) throws GendoxException {
        if (roleName == null) {
            return 0;
        }
        return switch (roleName) {
            case OrganizationRolesConstants.OWNER -> 4;
            case OrganizationRolesConstants.ADMIN -> 3;
            case OrganizationRolesConstants.EDITOR -> 2;
            case OrganizationRolesConstants.READER -> 1;
            default -> 0;
        };
    }

    public static boolean canChangeRole(String requesterRole, String targetRole) throws GendoxException {
        int requesterLevel = getRoleLevel(requesterRole);
        int targetLevel = getRoleLevel(targetRole);
        return requesterLevel >= targetLevel;
    }
}
