package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Invitation;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.OrganizationRoleUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserOrganizationService;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.InvitationCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.SubscriptionValidationService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserInvitationService;
import jakarta.mail.MessagingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
public class InvitationController {


    Logger logger = LoggerFactory.getLogger(InvitationController.class);

    private UserInvitationService userInvitationService;
    private SubscriptionValidationService subscriptionValidationService;
    private final ProjectService projectService;
    private final UserOrganizationService userOrganizationService;
    private final SecurityUtils securityUtils;

    @Autowired
    public InvitationController(UserInvitationService userInvitationService,
                                SubscriptionValidationService subscriptionValidationService,
                                ProjectService projectService,
                                UserOrganizationService userOrganizationService, SecurityUtils securityUtils) {
        this.userInvitationService = userInvitationService;
        this.subscriptionValidationService = subscriptionValidationService;
        this.projectService = projectService;
        this.userOrganizationService = userOrganizationService;
        this.securityUtils = securityUtils;
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_ADD_USERS', 'getRequestedOrgIdFromPathVariable')")
    @GetMapping("/organizations/{organizationId}/invitations")
    public Page<Invitation> getInvitationsByCriteria(@PathVariable("organizationId") String organizationId, InvitationCriteria criteria, Pageable pageable) throws GendoxException {
        if (criteria.getOrganizationId() == null) {
            criteria.setOrganizationId(organizationId);
        }
        if (!organizationId.equals(criteria.getOrganizationId())) {
            throw new GendoxException("ORGANIZATION_ID_MISMATCH", "Organization id in path variable and in criteria do not match", HttpStatus.BAD_REQUEST);
        }

        return userInvitationService.getInvitationsByCriteria(criteria, pageable);
    }


    @GetMapping("/invitations/acceptance")
    public Invitation acceptInvitation(@RequestParam("email") String inviteeEmail,@RequestParam("token") String token) throws GendoxException {

        if (token == null || token.isBlank()) {
            throw new GendoxException("INVITATION_NOT_FOUND", "Invitation not found", HttpStatus.NOT_FOUND);
        }
        return userInvitationService.acceptInvitation(inviteeEmail, token);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_ADD_USERS', 'getRequestedOrgIdFromPathVariable')")
    @PostMapping("/organizations/{organizationId}/invitations")
    public Invitation inviteUser(@PathVariable("organizationId") String organizationId, @RequestBody Invitation invitation, Authentication authentication) throws GendoxException, MessagingException {

        if (invitation.getOrganizationId() == null) {
            invitation.setOrganizationId(UUID.fromString(organizationId));
        }
        if (!organizationId.equals(invitation.getOrganizationId().toString())) {
            throw new GendoxException("ORGANIZATION_ID_MISMATCH", "Organization id in path variable and in criteria do not match", HttpStatus.BAD_REQUEST);
        }

        UUID inviterUserId = UUID.fromString(((UserProfile) authentication.getPrincipal()).getId());
        if (invitation.getProjectId() == null || invitation.getUserRoleType() == null) {
            throw new GendoxException("INVALID_INVITATION", "Project and role are required", HttpStatus.BAD_REQUEST);
        }
        projectService.validateProjectsBelongToOrganization(java.util.List.of(invitation.getProjectId()), invitation.getOrganizationId());
        if (!securityUtils.canAccessProject(invitation.getProjectId(), "OP_ADD_PROJECT_MEMBERS")) {
            throw new GendoxException("FORBIDDEN_PROJECT", "You cannot invite members to this project", HttpStatus.FORBIDDEN);
        }
        int invitedLevel = OrganizationRoleUtils.getRoleLevel(invitation.getUserRoleType().getName());
        if (invitedLevel == 0 || (!securityUtils.isSuperAdmin() && invitedLevel > OrganizationRoleUtils.getRoleLevel(
                userOrganizationService.getUserOrganizationRoleType(inviterUserId, invitation.getOrganizationId()).getName()))) {
            throw new GendoxException("INSUFFICIENT_ROLE", "You cannot assign a role higher than your own", HttpStatus.FORBIDDEN);
        }
        //check if the user is allowed to invite users
        if (!subscriptionValidationService.canInviteUsers(invitation.getOrganizationId())) {
            throw new GendoxException("USER_INVITATION_LIMIT_REACHED", "User has reached the limit of users that can be invited", HttpStatus.BAD_REQUEST);
        }

        String inviterEmail = ((UserProfile) authentication.getPrincipal()).getEmail();
        return userInvitationService.inviteUser(
                invitation.getInviteeEmail(),
                inviterUserId,
                inviterEmail,
                invitation.getOrganizationId().toString(),
                invitation.getProjectId().toString(),
                invitation.getUserRoleType().getName());
    }

}
