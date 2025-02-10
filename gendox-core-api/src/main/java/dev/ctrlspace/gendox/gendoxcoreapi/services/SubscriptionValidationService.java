package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.authentication.GendoxAuthenticationToken;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationPlan;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.*;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.DocumentPredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TimePeriodDTO;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.Date;


@Component
public class SubscriptionValidationService {

    Logger logger = LoggerFactory.getLogger(SubscriptionValidationService.class);

    private boolean isSubscriptionValidationEnabled;
    private OrganizationPlanService organizationPlanService;
    private DocumentInstanceRepository documentInstanceRepository;
    private DocumentInstanceSectionRepository documentInstanceSectionRepository;
    private InvitationRepository invitationRepository;
    private TypeService typeService;
    private OrganizationDailyUsageRepository organizationDailyUsageRepository;
    private IntegrationRepository integrationRepository;
    private ProjectService projectService;
    private ApiRateLimitService apiRateLimitService;


    @Autowired
    public SubscriptionValidationService(@Value("${gendox.features.subscription-validation}") boolean isSubscriptionValidationEnabled,
                                         OrganizationPlanService organizationPlanService,
                                         DocumentInstanceRepository documentInstanceRepository,
                                         DocumentInstanceSectionRepository documentInstanceSectionRepository,
                                         InvitationRepository invitationRepository,
                                         TypeService typeService,
                                         OrganizationDailyUsageRepository organizationDailyUsageRepository,
                                         IntegrationRepository integrationRepository,
                                         ProjectService projectService,
                                         ApiRateLimitService apiRateLimitService) {
        this.isSubscriptionValidationEnabled = isSubscriptionValidationEnabled;
        this.organizationPlanService = organizationPlanService;
        this.documentInstanceRepository = documentInstanceRepository;
        this.documentInstanceSectionRepository = documentInstanceSectionRepository;
        this.invitationRepository = invitationRepository;
        this.typeService = typeService;
        this.organizationDailyUsageRepository = organizationDailyUsageRepository;
        this.integrationRepository = integrationRepository;
        this.projectService = projectService;
        this.apiRateLimitService = apiRateLimitService;
    }


    // check for the Documents allowed for the organization
    public boolean canCreateDocuments(UUID organizationId) throws GendoxException {
        if (!isSubscriptionValidationEnabled) {
            return true;
        }
        OrganizationPlan activePlan = organizationPlanService.getActiveOrganizationPlan(organizationId);
        int maxDocuments = activePlan.getSubscriptionPlan().getUserMessageMonthlyLimitCount() * activePlan.getNumberOfSeats();
        int numberOfDocuments = this.countDocumentUploads(organizationId, activePlan.getStartDate(), activePlan.getEndDate());
        return numberOfDocuments < maxDocuments;
    }

    // check for the documents mb limit allowed for the organization
    public boolean canCreateDocumentsSize(UUID organizationId, Integer fileSize) throws GendoxException {
        if (!isSubscriptionValidationEnabled) {
            return true;
        }
        OrganizationPlan activePlan = organizationPlanService.getActiveOrganizationPlan(organizationId);
        int maxDocumentSize = activePlan.getSubscriptionPlan().getUserUploadLimitMb() * activePlan.getNumberOfSeats() * 1024 * 1024; // Convert MB to bytes;
        int totalDocumentSize = countDocumentsSize(organizationId, activePlan.getStartDate(), activePlan.getEndDate()) + fileSize;

        return totalDocumentSize < maxDocumentSize;
    }

    // check for the Document Sections allowed for the organization
    public boolean canCreateDocumentSections(UUID organizationId) throws GendoxException {
        if (!isSubscriptionValidationEnabled) {
            return true;
        }
        OrganizationPlan activePlan = organizationPlanService.getActiveOrganizationPlan(organizationId);
        int maxDocumentSections = activePlan.getSubscriptionPlan().getUserUploadLimitFileCount() * activePlan.getNumberOfSeats();
        int numberOfDocumentSections = this.countDocumentInstanceSections(this.getDocumentsByOrganizationIdAndTimePeriod(organizationId, activePlan.getStartDate(), activePlan.getEndDate()));

        return numberOfDocumentSections < maxDocumentSections;
    }

    // check for the messages allowed for the organization
    public boolean canSendMessage(UUID organizationId) throws GendoxException {
        if (!isSubscriptionValidationEnabled) {
            return true;
        }
        OrganizationPlan activePlan = organizationPlanService.getActiveOrganizationPlan(organizationId);
        int maxMessages = activePlan.getSubscriptionPlan().getUserUploadLimitFileCount() * activePlan.getNumberOfSeats();
        int numberOfMessages = this.countMessages(organizationId, activePlan.getStartDate(), activePlan.getEndDate());
        return numberOfMessages < maxMessages;
    }

    //check for the invitations allowed for the organization
    public boolean canInviteUsers(UUID organizationId) throws GendoxException {
        if (!isSubscriptionValidationEnabled) {
            return true;
        }
        OrganizationPlan activePlan = organizationPlanService.getActiveOrganizationPlan(organizationId);
        int maxInvitations = activePlan.getNumberOfSeats();
        int numberOfAcceptedInvitations = this.countAcceptedInvitations(organizationId);
        return numberOfAcceptedInvitations < maxInvitations;
    }

    // check for the number of integrations allowed for the organization
    public boolean canCreateIntegrations(UUID organizationId) {
        if (!isSubscriptionValidationEnabled) {
            return true;
        }
        OrganizationPlan activePlan = organizationPlanService.getActiveOrganizationPlan(organizationId);
        int maxIntegrations = activePlan.getSubscriptionPlan().getOrganizationWebSites() * activePlan.getNumberOfSeats();
        int numberOfIntegrations = this.countActiveIntegrations(organizationId);
        return numberOfIntegrations < maxIntegrations;
    }

    // check for the number of websites allowed for the organization
    public boolean canCreateWebsite(UUID organizationId, Integer numberOfWebsites) {
        if (!isSubscriptionValidationEnabled) {
            return true;
        }
        OrganizationPlan activePlan = organizationPlanService.getActiveOrganizationPlan(organizationId);
        Integer maxWebsites = activePlan.getSubscriptionPlan().getOrganizationWebSites() * activePlan.getNumberOfSeats();

        return numberOfWebsites < maxWebsites;
    }

    /**
     * Check if the API Key is within the subscription limits.
     * This included the rate limits and the subscription plan limits.
     * <p>
     * This method implements all the business logic required to check if the API Key is within the subscription limits.
     *
     * @param projectId      The project ID that the request is made for.
     * @param authentication The authentication object that contains the user details.
     * @param requestIP      The IP address of the request.
     * @return the successful consumption probe object that contains the rate limit details.
     * @throws GendoxException if the request is not within the subscription limits.
     */
    public ConsumptionProbe validateRequestIsInSubscriptionLimits(UUID projectId, Authentication authentication, String requestIP) throws GendoxException {
        Project project = projectService.getProjectById(projectId);
        OrganizationPlan activePlan = organizationPlanService.getActiveOrganizationPlan(project.getOrganizationId());
        return validateRateLimits(authentication, requestIP, activePlan);
    }


    public Page<DocumentInstance> getDocumentsByOrganizationIdAndTimePeriod(UUID organizationId, Instant startDate, Instant endDate) throws GendoxException {
        return documentInstanceRepository.findAll(DocumentPredicates
                .build(DocumentCriteria.builder()
                        .organizationId(organizationId.toString())
                        .createdBetween(new TimePeriodDTO(startDate, endDate))
                        .build()), PageRequest.of(0, 100));

    }

    public Integer countDocumentInstanceSections(Page<DocumentInstance> documentInstances) {
        Set<UUID> documentInstanceIds = documentInstances.getContent().stream()
                .map(DocumentInstance::getId)
                .collect(Collectors.toSet());

        // Use the repository method to count the DocumentInstanceSections related to the documentInstance IDs
        return (int) documentInstanceSectionRepository.countByDocumentInstanceIds(documentInstanceIds);
    }

    public Integer countDocumentUploads(UUID organizationId, Instant startDate, Instant endDate) throws GendoxException {
        Date start = Date.from(startDate);
        Date end = Date.from(endDate);

        Long totalDocumentUploads = organizationDailyUsageRepository.sumDocumentUploadsByOrganizationIdAndDateBetween(organizationId, start, end);
        return totalDocumentUploads != null ? totalDocumentUploads.intValue() : 0;
    }

    public Integer countDocumentsSize(UUID organizationId, Instant startDate, Instant endDate) throws GendoxException {
        Date start = Date.from(startDate);
        Date end = Date.from(endDate);

        Long totalDocumentSize = organizationDailyUsageRepository.sumStorageMbByOrganizationIdAndDateBetween(organizationId, start, end);
        return totalDocumentSize != null ? totalDocumentSize.intValue() : 0;
    }

    public Integer countMessages(UUID organizationId, Instant startDate, Instant endDate) throws GendoxException {
        Date start = Date.from(startDate);
        Date end = Date.from(endDate);

        Long totalMessages = organizationDailyUsageRepository.sumMessagesByOrganizationIdAndDateBetween(organizationId, start, end);
        return totalMessages != null ? totalMessages.intValue() : 0;
    }

    public Integer countAcceptedInvitations(UUID organizationId) {
        return (int) invitationRepository.countByOrganizationIdAndStatusTypeId(organizationId, typeService.getEmailInvitationStatusByName("ACCEPTED").getId());
    }

    public Integer countActiveIntegrations(UUID organizationId) {
        return (int) integrationRepository.countActiveIntegrationsByOrganizationId(organizationId);
    }

    /**
     * validates the Rate Limits for the API Key.
     * If it is a public request, it uses the public rate limits.
     * If it is a private request, it uses the private rate limits.
     * <p>
     * If the request is within the rate limits, it returns the consumption probe object.
     *
     * @param authentication
     * @param requestIP
     * @param plan
     * @return
     * @throws GendoxException if the rate limits are exceeded.
     */
    private ConsumptionProbe validateRateLimits(Authentication authentication, String requestIP, OrganizationPlan plan) throws GendoxException {
        String bucketKey = requestIP;
        int requests = plan.getApiRateLimit().getPublicCompletionsPerMinute();
        if (authentication != null) {
            bucketKey = ((GendoxAuthenticationToken) authentication).getPrincipal().getId();
            requests = plan.getApiRateLimit().getCompletionsPerMinute();
        }

        Bucket bucket = apiRateLimitService.getRateLimitBucketForUser(bucketKey, requests, 1);
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        logger.debug("Rate Limit Probe: " + probe);
        if (!probe.isConsumed()) {
            throw new GendoxException("RATE_LIMIT_EXCEEDED", "Rate Limit Exceeded", HttpStatus.TOO_MANY_REQUESTS, probe);
        }
        return probe;
    }



}
