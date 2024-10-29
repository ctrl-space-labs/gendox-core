package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.authentication.GendoxAuthenticationToken;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationPlan;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.OrganizationPlanCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.OrganizationPlanRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.OrganizationPlanPredicates;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

/**
 * Service method to handle subscription related operations and API Rate Limits for an Organization
 *
 */
@Service
public class OrganizationPlanService {

    Logger logger = org.slf4j.LoggerFactory.getLogger(getClass());

    private OrganizationPlanRepository organizationPlanRepository;
    private SubscriptionPlanService subscriptionPlanService;

    private ProjectService projectService;

    private ApiRateLimitService apiRateLimitService;


    @Autowired
    public OrganizationPlanService(OrganizationPlanRepository organizationPlanRepository,
                                   ApiRateLimitService apiRateLimitService,
                                   @Lazy ProjectService projectService,

                                   SubscriptionPlanService subscriptionPlanService) {
        this.organizationPlanRepository = organizationPlanRepository;
        this.apiRateLimitService = apiRateLimitService;
        this.subscriptionPlanService = subscriptionPlanService;
        this.projectService = projectService;
    }


    public OrganizationPlan getOrganizationPlanById(UUID organizationPlanId) throws GendoxException {
        return organizationPlanRepository.findById(organizationPlanId)
                .orElseThrow(() -> new GendoxException("ORGANIZATION_PLAN_NOT_FOUND", "Organization Plan not found", HttpStatus.NOT_FOUND));
    }

    public Page<OrganizationPlan> getAllOrganizationPlansByCriteria(OrganizationPlanCriteria criteria, Pageable pageable) {

        return organizationPlanRepository.findAll(OrganizationPlanPredicates.build(criteria), pageable);
    }

    public OrganizationPlan cancelSubscriptionPlan(UUID organizationPlanId) throws GendoxException {
        OrganizationPlan plan = getOrganizationPlanById(organizationPlanId);

        plan.setEndDate(Instant.now());

        return organizationPlanRepository.save(plan);
    }

    /**
     * For a specific date, only 1 plan can be active for an organization.
     * If no plan is active, then the organization is on the free plan.
     *
     * @param organizationId
     * @return
     */
    public OrganizationPlan getActiveOrganizationPlan(UUID organizationId) {
        OrganizationPlan plan = this.getAllOrganizationPlansByCriteria(OrganizationPlanCriteria
                        .builder()
                        .organizationId(organizationId)
                        .activeAtDate(Instant.now())
                        .build(), Pageable.unpaged())
                .getContent()
                .stream()
                .findFirst()
                .orElse(subscriptionPlanService.createDefaultFreePlan());

        return plan;
    }



    /**
     * Check if the API Key is within the subscription limits.
     * This included the rate limits and the subscription plan limits.
     *
     * This method implements all the business logic required to check if the API Key is within the subscription limits.
     *
     * @param projectId The project ID that the request is made for.
     * @param authentication The authentication object that contains the user details.
     * @param requestIP The IP address of the request.
     * @return the successful consumption probe object that contains the rate limit details.
     * @throws GendoxException if the request is not within the subscription limits.
     *
     */
    public ConsumptionProbe validateRequestIsInSubscriptionLimits(UUID projectId, Authentication authentication, String requestIP) throws GendoxException {


        Project project = projectService.getProjectById(projectId);

        return this.validateRequestIsInSubscriptionLimits(project, authentication, requestIP);
    }

    public ConsumptionProbe validateRequestIsInSubscriptionLimits(Project project, Authentication authentication, String requestIP) throws GendoxException {


        OrganizationPlan plan = getActiveOrganizationPlan(project.getOrganizationId());

        ConsumptionProbe probe = validateRateLimits(authentication, requestIP, plan);

        validateSubscriptionLimits(project, plan);
        return probe;
    }

    /**
     * Validate if the subscription limit has been exceeded for any of the subscription limits, like:
     * - Number of messages
     * - Total Number of uploaded documents
     * - Total MegaBytes of uploaded documents
     *
     * If AI model Provider key is missing for the Organization,
     * it runs the message limits check for the free plan.
     *
     * @param project
     * @param plan
     */
    public void validateSubscriptionLimits(Project project, OrganizationPlan plan) throws GendoxException {
        validateMessageSubscriptionLimits(project, plan);
        //TODO implement this
    }

    public void validateMessageSubscriptionLimits(Project project, OrganizationPlan plan) throws GendoxException {

        //TODO implement this
    }


    /**
     * validates the Rate Limits for the API Key.
     * If it is a public request, it uses the public rate limits.
     * If it is a private request, it uses the private rate limits.
     *
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
