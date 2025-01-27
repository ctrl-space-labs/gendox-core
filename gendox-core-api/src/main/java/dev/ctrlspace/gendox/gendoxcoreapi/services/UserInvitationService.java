package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Invitation;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Organization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.InvitationCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.InvitationRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.InvitationPredicate;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional(rollbackFor = Exception.class)
public class UserInvitationService {


    private InvitationRepository invitationRepository;
    private TypeService typeService;
    private UserOrganizationService userOrganizationService;
    private OrganizationService organizationService;
    private UserService userService;
    private ProjectMemberService projectMemberService;
    private EmailService emailService;
    private TemplateEngine templateEngine;
    private SubscriptionValidationService subscriptionValidationService;

    @Value("${gendox.domains.frontend}")
    private String frontendDomain;

    @Value("${gendox.user-invitation.accept-url-template}")
    private String acceptUrlTemplate;

    @Value("${gendox.emails.contact-email}")
    private String contactEmail;

    @Value("${gendox.user-invitation.ttl}")
    private long invitationTtl;


    @Autowired
    public UserInvitationService(InvitationRepository invitationRepository,
                                 TypeService typeService,
                                 UserOrganizationService userOrganizationService,
                                 OrganizationService organizationService,
                                 UserService userService,
                                 ProjectMemberService projectMemberService,
                                 EmailService emailService,
                                 TemplateEngine templateEngine,
                                 SubscriptionValidationService subscriptionValidationService) {
        this.invitationRepository = invitationRepository;
        this.typeService = typeService;
        this.userOrganizationService = userOrganizationService;
        this.organizationService = organizationService;
        this.userService = userService;
        this.projectMemberService = projectMemberService;
        this.emailService = emailService;
        this.templateEngine = templateEngine;
        this.subscriptionValidationService = subscriptionValidationService;
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


    public Invitation inviteUser(String inviteeEmail, UUID inviterUserId, String inviterEmail, String organizationId, String projectId,  String userRoleName) throws GendoxException, MessagingException {

        Optional<User> inviteeUser = userService.getOptionalByEmail(inviteeEmail);
        if (inviteeUser.isPresent() &&
                projectMemberService.isUserProjectMember(inviteeUser.get().getId(), UUID.fromString(projectId))) {
            throw new GendoxException("INVITATION_ALREADY_ACCEPTED", "User with email: " + inviteeEmail + " is already a member of project with id: " + projectId, HttpStatus.BAD_REQUEST);
        }
        Organization organization = organizationService.getById(UUID.fromString(organizationId));

        Invitation invitation = new Invitation();
        invitation.setInviteeEmail(inviteeEmail);

        invitation.setOrganizationId(UUID.fromString(organizationId));
        invitation.setProjectId(UUID.fromString(projectId));

        invitation.setUserRoleType(typeService.getOrganizationRolesByName(userRoleName));

        invitation.setToken(SecurityUtils.calculateSHA256(UUID.randomUUID().toString()));
        invitation.setExpiresAt(Instant.now().plusSeconds(invitationTtl));

        invitation.setInviterUserId(inviterUserId);
        invitation.setStatusType(typeService.getEmailInvitationStatusByName("PENDING"));
        invitation = invitationRepository.save(invitation);

        sendInvitationEmail(inviterEmail, invitation, organization);

        return invitation;
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

        //check if the user is allowed to accept the invitation
        if (!subscriptionValidationService.canInviteUsers(invitation.getOrganizationId())) {
            throw new GendoxException("USER_INVITATION_LIMIT_REACHED", "Please contact organization's administrator.", HttpStatus.BAD_REQUEST);
        }

        invitation.setStatusType(typeService.getEmailInvitationStatusByName("ACCEPTED"));

        // if user exists, create user-organization. In case of user not existing, user will be created during signup
        Optional<User> invitedUser = userService.getOptionalByEmail(inviteeEmail);
        if (invitedUser.isPresent() &&
                !userOrganizationService.isUserOrganizationMember(invitedUser.get().getId(), invitation.getOrganizationId())) {

            userService.evictUserProfileByUniqueIdentifier(userService.getUserIdentifier(invitedUser.get()));
            userOrganizationService.createUserOrganization(invitedUser.get().getId(), invitation.getOrganizationId(), invitation.getUserRoleType().getName());

        }

        if (invitedUser.isPresent() &&
                !projectMemberService.isUserProjectMember(invitedUser.get().getId(), invitation.getProjectId())) {

            userService.evictUserProfileByUniqueIdentifier(userService.getUserIdentifier(invitedUser.get()));
            projectMemberService.createProjectMember(invitedUser.get().getId(), invitation.getProjectId());
        }

        return invitationRepository.save(invitation);
    }



    private void sendInvitationEmail(String inviterEmail, Invitation invitation, Organization organization) throws MessagingException {
        String emailHTML = getInvitationEmailContent(invitation, inviterEmail, organization.getName());
        String emailPlainText = getInvitationPlainTextEmailContent(invitation, inviterEmail, organization.getName());

         emailService.sendEmail(invitation.getInviteeEmail(), "Invitation to Gendox Organization", emailHTML, emailPlainText);
    }

    private String getInvitationEmailContent(Invitation invitation, String inviterEmail, String organizationName) {


        Context context = new Context();
        context.setVariable("title", "Invitation to Gendox Organization");
        context.setVariable("subtitle", "Invitation to Gendox Organization!");
        context.setVariable("InviterEmail", inviterEmail);
        context.setVariable("organizationName", organizationName);
        context.setVariable("invitationLink", String.format(frontendDomain+acceptUrlTemplate, invitation.getInviteeEmail(), invitation.getToken()));
        // Convert the Instant to a ZonedDateTime
        ZonedDateTime zonedDateTime = invitation.getExpiresAt().atZone(ZoneId.of("UTC"));

        // Define the desired format
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss 'UTC'");

        // Format the ZonedDateTime
        String formattedDate = zonedDateTime.format(formatter);

        context.setVariable("expirationDate", formattedDate);
        context.setVariable("recipientEmail", invitation.getInviteeEmail());
        context.setVariable("contactEmail", contactEmail);

        return templateEngine.process("emails/invitationToOrganization", context);
    }

    private String getInvitationPlainTextEmailContent(Invitation invitation, String inviterEmail, String organizationName) {

        Context context = new Context();
        context.setVariable("organizationName", organizationName);
        context.setVariable("inviterEmail", inviterEmail);
        context.setVariable("invitationLink", String.format(frontendDomain+acceptUrlTemplate, invitation.getInviteeEmail(), invitation.getToken()));

        return templateEngine.process("emails/invitationToOrganizationText.txt", context);
    }



}
