package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.authentication.GendoxAuthenticationToken;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationPlan;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TimePeriodDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.BillingWindowUtils;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import java.util.Date;


@Component
public class SubscriptionValidationService {

    Logger logger = LoggerFactory.getLogger(SubscriptionValidationService.class);

    private boolean isSubscriptionValidationEnabled;
    private OrganizationPlanService organizationPlanService;
    private DocumentInstanceRepository documentInstanceRepository;
    private InvitationRepository invitationRepository;
    private TypeService typeService;
    private OrganizationDailyUsageRepository organizationDailyUsageRepository;
    private IntegrationRepository integrationRepository;
    private ProjectRepository projectRepository;
    private ProjectService projectService;
    private OrganizationWebSiteRepository organizationWebSiteRepository;
    private ApiRateLimitService apiRateLimitService;
    private OrganizationModelKeyService organizationModelKeyService;
    private WebScrapePageRepository webScrapePageRepository;
    private double providedKeyAllowanceRatio;


    @Autowired
    public SubscriptionValidationService(@Value("${gendox.features.subscription-validation}") boolean isSubscriptionValidationEnabled,
                                         OrganizationPlanService organizationPlanService,
                                         DocumentInstanceRepository documentInstanceRepository,
                                         InvitationRepository invitationRepository,
                                         TypeService typeService,
                                         OrganizationDailyUsageRepository organizationDailyUsageRepository,
                                         IntegrationRepository integrationRepository,
                                         ProjectRepository projectRepository,
                                         @Lazy ProjectService projectService,
                                         OrganizationWebSiteRepository organizationWebSiteRepository,
                                         ApiRateLimitService apiRateLimitService,
                                         OrganizationModelKeyService organizationModelKeyService,
                                         WebScrapePageRepository webScrapePageRepository,
                                         @Value("${gendox.features.provided-key-allowance-ratio}") double providedKeyAllowanceRatio) {
        this.isSubscriptionValidationEnabled = isSubscriptionValidationEnabled;
        this.organizationPlanService = organizationPlanService;
        this.documentInstanceRepository = documentInstanceRepository;
        this.invitationRepository = invitationRepository;
        this.typeService = typeService;
        this.organizationDailyUsageRepository = organizationDailyUsageRepository;
        this.integrationRepository = integrationRepository;
        this.projectRepository = projectRepository;
        this.projectService = projectService;
        this.organizationWebSiteRepository = organizationWebSiteRepository;
        this.apiRateLimitService = apiRateLimitService;
        this.organizationModelKeyService = organizationModelKeyService;
        this.webScrapePageRepository = webScrapePageRepository;
        this.providedKeyAllowanceRatio = providedKeyAllowanceRatio;
    }


    // plan limits are stored per seat, a missing limit allows nothing
    private int effectiveLimit(Integer planLimit, Integer numberOfSeats) {
        if (planLimit == null) {
            return 0;
        }
        return planLimit * numberOfSeats;
    }


    // check for the Documents allowed for the organization
    public boolean canCreateDocuments(UUID organizationId) throws GendoxException {
        if (!isSubscriptionValidationEnabled) {
            return true;
        }
        OrganizationPlan activePlan = organizationPlanService.getActiveOrganizationPlan(organizationId);
        int maxDocuments = effectiveLimit(activePlan.getSubscriptionPlan().getUserUploadLimitFileCount(), activePlan.getNumberOfSeats());
        // documents are a stock, not a monthly flow, so everything the organization currently holds counts
        int numberOfDocuments = this.countDocumentUploads(organizationId, Instant.EPOCH, Instant.now());
        return numberOfDocuments < maxDocuments;
    }

    // check for the documents mb limit allowed for the organization
    public boolean canCreateDocumentsSize(UUID organizationId, Integer fileSize) throws GendoxException {
        if (!isSubscriptionValidationEnabled) {
            return true;
        }
        OrganizationPlan activePlan = organizationPlanService.getActiveOrganizationPlan(organizationId);
        long maxDocumentSize = effectiveLimit(activePlan.getSubscriptionPlan().getUserUploadLimitMb(), activePlan.getNumberOfSeats());
        long totalDocumentSize = countDocumentsSize(organizationId, Instant.EPOCH, Instant.now()) + fileSize;

        long totalDocumentSizeMb = totalDocumentSize / (1024 * 1024);
        return totalDocumentSizeMb < maxDocumentSize;

    }

    // check for the total document pages allowed for the organization, so a few very large documents can't consume the whole allowance
    public boolean canCreateDocumentPages(UUID organizationId, Integer numberOfPages) throws GendoxException {
        if (!isSubscriptionValidationEnabled) {
            return true;
        }
        return hasDocumentPageCapacity(organizationId, billablePages(numberOfPages));
    }

    public boolean canCreateDocumentPages(UUID organizationId, Integer numberOfPages, Integer replacedNumberOfPages) throws GendoxException {
        if (!isSubscriptionValidationEnabled) {
            return true;
        }
        int additionalBillablePages = billablePages(numberOfPages) - billablePages(replacedNumberOfPages);
        return hasDocumentPageCapacity(organizationId, additionalBillablePages);
    }

    private boolean hasDocumentPageCapacity(UUID organizationId, int additionalBillablePages) throws GendoxException {
        OrganizationPlan activePlan = organizationPlanService.getActiveOrganizationPlan(organizationId);
        int maxDocumentPages = effectiveLimit(activePlan.getSubscriptionPlan().getDocumentPagesLimit(), activePlan.getNumberOfSeats());
        return this.countDocumentPages(organizationId) + additionalBillablePages <= maxDocumentPages;
    }

    private int billablePages(Integer numberOfPages) {
        return numberOfPages != null ? numberOfPages : 1;
    }

    // check for the messages allowed for the organization in the current billing period
    // TODO this takes 200ms, performance improvement is needed
    public boolean canSendMessage(UUID organizationId, AiModel completionModel) throws GendoxException {
        if (!isSubscriptionValidationEnabled) {
            return true;
        }
        OrganizationPlan activePlan = organizationPlanService.getActiveOrganizationPlan(organizationId);
        int maxMessages = effectiveLimit(activePlan.getSubscriptionPlan().getUserMessageMonthlyLimitCount(), activePlan.getNumberOfSeats());
        // a model used with the API key provided by Gendox gets only a share of the allowance
        if (organizationModelKeyService.getKeyForModel(organizationId, completionModel) == null) {
            maxMessages = (int) Math.ceil(maxMessages * providedKeyAllowanceRatio);
        }
        TimePeriodDTO billingPeriod = BillingWindowUtils.currentBillingPeriod(activePlan.getStartDate(), Clock.systemUTC());
        // usage is stored per day, so the whole first day of the period is counted
        int numberOfMessages = this.countMessages(organizationId, billingPeriod.from().truncatedTo(ChronoUnit.DAYS), billingPeriod.to());
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
        int maxIntegrations = effectiveLimit(activePlan.getSubscriptionPlan().getOrganizationWebSites(), activePlan.getNumberOfSeats());
        int numberOfIntegrations = this.countActiveIntegrations(organizationId);
        return numberOfIntegrations < maxIntegrations;
    }

    // check for the number of websites allowed for the organization
    public boolean canCreateWebsite(UUID organizationId) {
        if (!isSubscriptionValidationEnabled) {
            return true;
        }
        OrganizationPlan activePlan = organizationPlanService.getActiveOrganizationPlan(organizationId);
        int maxWebsites = effectiveLimit(activePlan.getSubscriptionPlan().getOrganizationWebSites(), activePlan.getNumberOfSeats());

        return this.countWebsites(organizationId) < maxWebsites;
    }

    // check for the number of active projects allowed for the organization
    public boolean canCreateProjects(UUID organizationId) {
        if (!isSubscriptionValidationEnabled) {
            return true;
        }
        OrganizationPlan activePlan = organizationPlanService.getActiveOrganizationPlan(organizationId);
        int maxProjects = effectiveLimit(activePlan.getSubscriptionPlan().getProjectLimit(), activePlan.getNumberOfSeats());

        return this.countActiveProjects(organizationId) < maxProjects;
    }

    // check whether the plan includes web scraping at all
    public boolean canUseWebScrape(UUID organizationId) {
        if (!isSubscriptionValidationEnabled) {
            return true;
        }
        OrganizationPlan activePlan = organizationPlanService.getActiveOrganizationPlan(organizationId);
        int maxPages = effectiveLimit(activePlan.getSubscriptionPlan().getWebScrapePagesMonthlyLimit(),
                activePlan.getNumberOfSeats());

        return maxPages > 0;
    }

    // check the monthly page budget for the current billing period
    public boolean canScrapeWebPages(UUID organizationId, int pageCount) {
        if (!isSubscriptionValidationEnabled) {
            return true;
        }
        OrganizationPlan activePlan = organizationPlanService.getActiveOrganizationPlan(organizationId);
        int maxPages = effectiveLimit(activePlan.getSubscriptionPlan().getWebScrapePagesMonthlyLimit(),
                activePlan.getNumberOfSeats());

        TimePeriodDTO billingPeriod = BillingWindowUtils.currentBillingPeriod(
                activePlan.getStartDate(), Clock.systemUTC());
        int scrapedPages = this.countScrapedPages(organizationId, billingPeriod.from(), billingPeriod.to());

        return scrapedPages + pageCount <= maxPages;
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


    public Integer countDocumentPages(UUID organizationId) {
        Long totalDocumentPages = documentInstanceRepository.sumNumberOfPagesByOrganizationId(organizationId);
        return totalDocumentPages != null ? totalDocumentPages.intValue() : 0;
    }

    public Integer countWebsites(UUID organizationId) {
        return (int) organizationWebSiteRepository.countByOrganizationId(organizationId);
    }

    public Integer countActiveProjects(UUID organizationId) {
        return (int) projectRepository.countActiveProjectsByOrganizationId(organizationId);
    }

    public Integer countDocumentUploads(UUID organizationId, Instant startDate, Instant endDate) throws GendoxException {
        Date start = Date.from(startDate);
        Date end = Date.from(endDate);

        Long totalDocumentUploads = organizationDailyUsageRepository.sumDocumentUploadsByOrganizationIdAndDateBetween(organizationId, start, end);
        return totalDocumentUploads != null ? totalDocumentUploads.intValue() : 0;
    }

    /**
     * Total bytes stored by the organization. Returned as a long, the sum outgrows an int well
     * before the storage limit of the larger plans is reached.
     */
    public Long countDocumentsSize(UUID organizationId, Instant startDate, Instant endDate) throws GendoxException {
        Date start = Date.from(startDate);
        Date end = Date.from(endDate);

        Long totalDocumentSize = organizationDailyUsageRepository.sumStorageMbByOrganizationIdAndDateBetween(organizationId, start, end);
        return totalDocumentSize != null ? totalDocumentSize : 0L;
    }

    public Integer countMessages(UUID organizationId, Instant startDate, Instant endDate) throws GendoxException {
        Date start = Date.from(startDate);
        Date end = Date.from(endDate);

        Long totalMessages = organizationDailyUsageRepository.sumMessagesByOrganizationIdAndDateBetween(organizationId, start, end);
        return totalMessages != null ? totalMessages.intValue() : 0;
    }

    public Integer countScrapedPages(UUID organizationId, Instant startDate, Instant endDate) {
        return (int) webScrapePageRepository
                .countScrapedPagesByOrganizationIdAndPeriod(organizationId, startDate, endDate);
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
