package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Invitation;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Organization;
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

    @Autowired
    public InvitationController(UserInvitationService userInvitationService,
                                SubscriptionValidationService subscriptionValidationService) {
        this.userInvitationService = userInvitationService;
        this.subscriptionValidationService = subscriptionValidationService;
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
