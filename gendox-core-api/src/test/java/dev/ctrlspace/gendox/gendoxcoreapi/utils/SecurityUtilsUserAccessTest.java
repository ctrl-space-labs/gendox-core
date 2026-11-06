package dev.ctrlspace.gendox.gendoxcoreapi.utils;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.OrganizationUserDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.ProjectOrganizationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.UserCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.UserNamesConstants;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class SecurityUtilsUserAccessTest {

    @InjectMocks
    private SecurityUtils securityUtils;

    private final String userId = UUID.randomUUID().toString();
    private final String orgId = UUID.randomUUID().toString();
    private final String projectId = UUID.randomUUID().toString();

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void user_canAccessOnlyThemself() {
        loginAs(UserNamesConstants.GENDOX_USER, "OP_READ_DOCUMENT");

        assertTrue(securityUtils.isCurrentUser(UUID.fromString(userId)));
        assertFalse(securityUtils.isCurrentUser(UUID.randomUUID()));
    }

    @Test
    void superAdmin_canAccessAnyUser() {
        loginAs(UserNamesConstants.GENDOX_SUPER_ADMIN, "OP_READ_DOCUMENT");

        assertTrue(securityUtils.isCurrentUser(UUID.randomUUID()));
    }

    @Test
    void search_isAllowedInOwnOrganizationAndProject() {
        loginAs(UserNamesConstants.GENDOX_USER, "OP_READ_DOCUMENT");

        assertTrue(securityUtils.canSearchUsers(UserCriteria.builder().organizationId(orgId).build()));
        assertTrue(securityUtils.canSearchUsers(UserCriteria.builder().projectId(projectId).build()));
        assertTrue(securityUtils.canSearchUsers(UserCriteria.builder().organizationId(orgId).projectId(projectId).build()));
    }

    @Test
    void search_isRejectedOutsideOwnOrganizationAndProject() {
        loginAs(UserNamesConstants.GENDOX_USER, "OP_READ_DOCUMENT");
        String otherId = UUID.randomUUID().toString();

        assertFalse(securityUtils.canSearchUsers(UserCriteria.builder().organizationId(otherId).build()));
        assertFalse(securityUtils.canSearchUsers(UserCriteria.builder().projectId(otherId).build()));
        // a readable project must not open up an organization the user is not in
        assertFalse(securityUtils.canSearchUsers(UserCriteria.builder().organizationId(otherId).projectId(projectId).build()));
    }

    @Test
    void search_withoutScopeOrWithFetchAll_isRejectedForUsers() {
        loginAs(UserNamesConstants.GENDOX_USER, "OP_READ_DOCUMENT");

        assertFalse(securityUtils.canSearchUsers(new UserCriteria()));
        assertFalse(securityUtils.canSearchUsers(UserCriteria.builder().email("someone@test.com").build()));
        assertFalse(securityUtils.canSearchUsers(UserCriteria.builder().organizationId(orgId).fetchAll(true).build()));
    }

    @Test
    void search_withoutReadAuthority_isRejected() {
        loginAs(UserNamesConstants.GENDOX_USER, "OP_WRITE_DOCUMENT");

        assertFalse(securityUtils.canSearchUsers(UserCriteria.builder().organizationId(orgId).build()));
    }

    @Test
    void superAdmin_canSearchAllUsers() {
        loginAs(UserNamesConstants.GENDOX_SUPER_ADMIN);

        assertTrue(securityUtils.canSearchUsers(UserCriteria.builder().fetchAll(true).build()));
    }

    private void loginAs(String userType, String... orgAuthorities) {
        Type type = new Type();
        type.setName(userType);

        OrganizationUserDTO organization = new OrganizationUserDTO();
        organization.setId(orgId);
        organization.setAuthorities(Set.of(orgAuthorities));
        organization.setProjects(List.of(ProjectOrganizationDTO.builder().id(projectId).build()));

        UserProfile userProfile = UserProfile.builder()
                .id(userId)
                .globalUserRoleType(type)
                .organizations(List.of(organization))
                .build();

        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken(userProfile, null));
    }
}
