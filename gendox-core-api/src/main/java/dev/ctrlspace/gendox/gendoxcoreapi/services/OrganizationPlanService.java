package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.SubscriptionNotificationConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Organization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationPlan;
import dev.ctrlspace.gendox.gendoxcoreapi.model.SubscriptionPlan;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.SubscriptionNotificationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.OrganizationPlanCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.OrganizationPlanRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.OrganizationPlanPredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.SubscriptionStatusConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Service method to handle subscription related operations and API Rate Limits for an Organization
 */
@Service
public class OrganizationPlanService {

    Logger logger = LoggerFactory.getLogger(OrganizationPlanService.class);
    private OrganizationPlanRepository organizationPlanRepository;
    private SubscriptionPlanService subscriptionPlanService;
    private SubscriptionNotificationConverter subscriptionNotificationConverter;


    @Autowired
    public OrganizationPlanService(OrganizationPlanRepository organizationPlanRepository,
                                   SubscriptionPlanService subscriptionPlanService,
                                   SubscriptionNotificationConverter subscriptionNotificationConverter) {
        this.organizationPlanRepository = organizationPlanRepository;
        this.subscriptionPlanService = subscriptionPlanService;
        this.subscriptionNotificationConverter = subscriptionNotificationConverter;
    }


    public OrganizationPlan getOrganizationPlanById(UUID organizationPlanId) throws GendoxException {
        return organizationPlanRepository.findById(organizationPlanId)
                .orElseThrow(() -> new GendoxException("ORGANIZATION_PLAN_NOT_FOUND", "Organization Plan not found", HttpStatus.NOT_FOUND));
    }

    public List<OrganizationPlan> getAllOrganizationPlansByOrganizationId(UUID organizationId) {
        return organizationPlanRepository.findAllByOrganizationId(organizationId);
    }

    public Page<OrganizationPlan> getAllOrganizationPlansByCriteria(OrganizationPlanCriteria criteria, Pageable pageable) {
        return organizationPlanRepository.findAll(OrganizationPlanPredicates.build(criteria), pageable);
    }

    public OrganizationPlan cancelOrganizationPlan(UUID organizationPlanId) throws GendoxException {
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

    // Create or update organization plan based on subscription notification
    public OrganizationPlan upsertOrganizationPlan(SubscriptionNotificationDTO subscriptionNotificationDTO, Organization organization) throws GendoxException {
        logger.info("Processing subscription notification for organization: {}", organization.getId());
        validateSubscriptionData(subscriptionNotificationDTO); // 🚨 Validate input data
        logger.info("Validating subscription data: email: {}, productSKU: {}, numberOfSeats: {}, startDate: {}, endDate: {}, status: {}",
                subscriptionNotificationDTO.getEmail(),
                subscriptionNotificationDTO.getProductSKU(),
                subscriptionNotificationDTO.getNumberOfSeats(),
                subscriptionNotificationDTO.getStartDate(),
                subscriptionNotificationDTO.getEndDate(),
                subscriptionNotificationDTO.getStatus());
        List<OrganizationPlan> organizationPlans = this.getAllOrganizationPlansByOrganizationId(organization.getId());

        OrganizationPlan matchingPlan = findOverlappingPlan(organizationPlans, subscriptionNotificationDTO.getStartDate(), subscriptionNotificationDTO.getEndDate());

        if (matchingPlan != null) {
            return processOverlappingPlan(matchingPlan, subscriptionNotificationDTO); // 🔄 Handle existing plan
        }
        return createNewOrganizationPlan(subscriptionNotificationDTO, organization); // ✅ Create a new plan if no overlap
    }

    // Validate input data
    private void validateSubscriptionData(SubscriptionNotificationDTO dto) throws GendoxException {
        if (dto.getEndDate().isBefore(dto.getStartDate())) {
            throw new GendoxException("INVALID_DATE_RANGE", "End date cannot be before start date.", HttpStatus.BAD_REQUEST);
        }
        if (dto.getNumberOfSeats() != null && dto.getNumberOfSeats() < 0) {
            throw new GendoxException("INVALID_SEATS", "Number of seats cannot be negative.", HttpStatus.BAD_REQUEST);
        }
    }

    // Find overlapping plan
    private OrganizationPlan findOverlappingPlan(List<OrganizationPlan> organizationPlans, Instant newStartDate, Instant newEndDate) {
        for (OrganizationPlan plan : organizationPlans) {
            Instant existingStartDate = plan.getStartDate();
            Instant existingEndDate = plan.getEndDate();

            if (!newEndDate.isBefore(existingStartDate) && !newStartDate.isAfter(existingEndDate)) {
                return plan; // Found an overlapping plan
            }
        }
        return null; // No overlap found
    }

    // Process overlapping plan
    private OrganizationPlan processOverlappingPlan(OrganizationPlan matchingPlan, SubscriptionNotificationDTO dto) throws GendoxException {
        // Handle refund: set the end date to now
        if ((SubscriptionStatusConstants.REFUND).equalsIgnoreCase(dto.getStatus())) {
            matchingPlan.setEndDate(Instant.now());
            matchingPlan.setStatus(SubscriptionStatusConstants.REFUND);
            return organizationPlanRepository.save(matchingPlan);
        }

        // Handle cancellation: mark the plan as cancelled
        if ((SubscriptionStatusConstants.CANCELLED).equalsIgnoreCase(dto.getStatus())) {
            matchingPlan.setStatus(SubscriptionStatusConstants.CANCELLED);
            return organizationPlanRepository.save(matchingPlan);
        }

        // Handle active status
        if ((SubscriptionStatusConstants.ACTIVE).equalsIgnoreCase(dto.getStatus())) {
            SubscriptionPlan newPlan = subscriptionPlanService.getSubscriptionPlanBySku(dto.getProductSKU());
            matchingPlan.setSubscriptionPlan(newPlan);
            matchingPlan.setApiRateLimit(newPlan.getApiRateLimit());
            matchingPlan.setNumberOfSeats(dto.getNumberOfSeats());
            matchingPlan.setUpdatedAt(Instant.now());
            matchingPlan.setStatus(SubscriptionStatusConstants.ACTIVE);
            matchingPlan.setStartDate(dto.getStartDate());
            matchingPlan.setEndDate(dto.getEndDate());
            return organizationPlanRepository.save(matchingPlan);
        }

        // If none of the conditions are met, throw a conflict exception
        throw new GendoxException("INVALID_STATUS", "Invalid status provided in subscription notification.", HttpStatus.CONFLICT);
    }


    // Create new plan entry
    private OrganizationPlan createNewOrganizationPlan(SubscriptionNotificationDTO dto, Organization organization) throws GendoxException {
        OrganizationPlan newPlanEntry = subscriptionNotificationConverter.convertToOrganizationPlan(dto);
        newPlanEntry.setCreatedAt(Instant.now());
        newPlanEntry.setUpdatedAt(Instant.now());
        newPlanEntry.setOrganization(organization);
        newPlanEntry.setStatus(SubscriptionStatusConstants.ACTIVE);
        logger.info("Creating new organization plan: {}", newPlanEntry);
        return organizationPlanRepository.save(newPlanEntry);
    }


}
