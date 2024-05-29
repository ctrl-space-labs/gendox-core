package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Invitation;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Organization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.InvitationCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.InvitationRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.InvitationPredicate;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserInvitationService {


    private InvitationRepository invitationRepository;
    private TypeService typeService;

    private UserOrganizationService userOrganizationService;

    private UserService userService;

    @Value("${gendox.user-invitation.ttl}")
    private long invitationTtl;


    @Autowired
    public UserInvitationService(InvitationRepository invitationRepository,
                                 TypeService typeService,
                                 UserOrganizationService userOrganizationService,
                                 UserService userService) {
        this.invitationRepository = invitationRepository;
        this.typeService = typeService;
        this.userOrganizationService = userOrganizationService;
        this.userService = userService;
    }

    public Optional<Invitation> getOptionalInvitationById(UUID id) {
        return invitationRepository.findById(id);
    }

    public Invitation getInvitationById(UUID id) throws GendoxException {
        return invitationRepository.findById(id)
                .orElseThrow(() -> new GendoxException("INVITATION_NOT_FOUND", "Invitation not found with id: " + id, HttpStatus.NOT_FOUND));
    }

    public Page<Invitation> getInvitationsByCriteria(InvitationCriteria criteria, Pageable pageable) {
        return invitationRepository.findAll(InvitationPredicate.build(criteria), pageable);
    }

    public Invitation getByInviteeEmailAndToken(String inviteeEmail, String token) throws GendoxException {
        return invitationRepository.findByInviteeEmailAndToken(inviteeEmail, token)
                .orElseThrow(() -> new GendoxException("INVITATION_NOT_FOUND", "Invitation not found with email: " + inviteeEmail + " and token: " + token, HttpStatus.NOT_FOUND));
    }


    public Invitation inviteUser(String inviteeEmail, UUID inviterUserId, String organizationId, String userRoleName) throws GendoxException {

        Optional<User> inviteeUser = userService.getOptionalByEmail(inviteeEmail);
        if (inviteeUser.isPresent() &&
                userOrganizationService.isUserOrganizationMember(inviteeUser.get().getId(), UUID.fromString(organizationId))) {
            throw new GendoxException("INVITATION_ALREADY_ACCEPTED", "User with email: " + inviteeEmail + " is already a member of organization with id: " + organizationId, HttpStatus.BAD_REQUEST);
        }

        Invitation invitation = new Invitation();
        invitation.setInviteeEmail(inviteeEmail);

        invitation.setOrganizationId(UUID.fromString(organizationId));

        invitation.setUserRoleType(typeService.getOrganizationRolesByName(userRoleName));

        invitation.setToken(SecurityUtils.calculateSHA256(UUID.randomUUID().toString()));
        invitation.setExpiresAt(Instant.now().plusSeconds(invitationTtl));

        invitation.setInviterUserId(inviterUserId);
        invitation.setStatusType(typeService.getEmailInvitationStatusByName("PENDING"));
        return invitationRepository.save(invitation);
    }

    public boolean isInvitationValid(UUID invitationId) throws GendoxException {
        return invitationRepository.existsByIdAndExpiresAtAfter(invitationId, Instant.now());
    }

    public Invitation expireInvitation(UUID id) throws GendoxException {
        if (isInvitationValid(id)) {
            throw new GendoxException("INVITATION_EXPIRED", "Invitation with id: " + id + "has expired", HttpStatus.BAD_REQUEST);
        }
        Invitation invitation = getInvitationById(id);
        if (!invitation.getStatusType().getName().equals("PENDING")) {
            throw new GendoxException("INVITATION_EXPIRED", "Invitation with id: " + id + "has already been accepted or expired", HttpStatus.BAD_REQUEST);
        }


        invitation.setExpiresAt(Instant.now().minusSeconds(1));
        return invitationRepository.save(invitation);
    }

    public Invitation acceptInvitation(String inviteeEmail, String token) throws GendoxException {

        Invitation invitation = getByInviteeEmailAndToken(inviteeEmail, token);

        invitation.setStatusType(typeService.getEmailInvitationStatusByName("ACCEPTED"));

        // if user exists, create user-organization. In case of user not existing, user will be created during signup
        Optional<User> inviteeUser = userService.getOptionalByEmail(inviteeEmail);
        if (inviteeUser.isPresent() &&
                !userOrganizationService.isUserOrganizationMember(inviteeUser.get().getId(), invitation.getOrganizationId())) {
            userOrganizationService.createUserOrganization(inviteeUser.get().getId(), invitation.getOrganizationId(), invitation.getUserRoleType().getName());

        }

        return invitationRepository.save(invitation);
    }



}
