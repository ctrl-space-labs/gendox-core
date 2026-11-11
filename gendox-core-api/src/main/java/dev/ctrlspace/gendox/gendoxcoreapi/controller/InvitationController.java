package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Invitation;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Organization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.AccessCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.InvitationCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.SubscriptionValidationService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserInvitationService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserOrganizationService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.OrganizationRoleUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
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

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
public class InvitationController {


    Logger logger = LoggerFactory.getLogger(InvitationController.class);

    private UserInvitationService userInvitationService;
    private SubscriptionValidationService subscriptionValidationService;
    private ProjectService projectService;
    private UserOrganizationService userOrganizationService;
    private SecurityUtils securityUtils;

    @Autowired
    public InvitationController(UserInvitationService userInvitationService,
                                SubscriptionValidationService subscriptionValidationService,
                                ProjectService projectService,
                                UserOrganizationService userOrganizationService,
                                SecurityUtils securityUtils) {
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
    public Invitation acceptInvitation(@RequestParam("email") String inviteeEmail, @RequestParam("token") String token) throws GendoxException {

        // A revoked invitation only has its expiry moved to the past, and an accepted link must not
        // add the member again after they were removed: only pending, unexpired invitations are accepted here.
        // Invitations accepted before signup are still completed by the registration filter.
        Invitation invitation = userInvitationService.getByInviteeEmailAndToken(inviteeEmail, token);
        if (invitation.getExpiresAt() == null || invitation.getExpiresAt().isBefore(Instant.now())) {
            throw new GendoxException("INVITATION_EXPIRED", "Invitation has expired", HttpStatus.BAD_REQUEST);
        }
        if (invitation.getStatusType() == null || !"PENDING".equals(invitation.getStatusType().getName())) {
            throw new GendoxException("INVITATION_ALREADY_ACCEPTED", "Invitation has already been accepted", HttpStatus.BAD_REQUEST);
        }

        return userInvitationService.fillAcceptanceNames(userInvitationService.acceptInvitation(inviteeEmail, token));
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
        if (invitation.getProjectId() == null || invitation.getUserRoleType() == null) {
            throw new GendoxException("INVALID_INVITATION", "Project and role are required", HttpStatus.BAD_REQUEST);
        }
        // the project must be of this organization, and one the inviter can add members to
        projectService.validateProjectsBelongToOrganization(List.of(invitation.getProjectId()), invitation.getOrganizationId());
        UserProfile inviter = (UserProfile) authentication.getPrincipal();
        if (!securityUtils.hasAuthority(inviter, "OP_ADD_PROJECT_MEMBERS",
                AccessCriteria.builder().projectIds(Set.of(invitation.getProjectId().toString())).build())) {
            throw new GendoxException("FORBIDDEN_PROJECT", "You cannot invite members to this project", HttpStatus.FORBIDDEN);
        }
        // users can give at most the role they have in the organization, as when changing roles
        if (!securityUtils.isSuperAdmin()) {
            String inviterRole = userOrganizationService.getUserOrganizationRoleType(UUID.fromString(inviter.getId()), invitation.getOrganizationId()).getName();
            if (!OrganizationRoleUtils.canChangeRole(inviterRole, invitation.getUserRoleType().getName())) {
                throw new GendoxException("USER_ROLE_CHANGE_NOT_ALLOWED", "You cannot give a role higher than your own", HttpStatus.FORBIDDEN);
            }
        }

        //check if the user is allowed to invite users
        if (!subscriptionValidationService.canInviteUsers(invitation.getOrganizationId())) {
            throw new GendoxException("USER_INVITATION_LIMIT_REACHED", "User has reached the limit of users that can be invited", HttpStatus.BAD_REQUEST);
        }

        UUID inviterUserId = UUID.fromString(((UserProfile) authentication.getPrincipal()).getId());
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
