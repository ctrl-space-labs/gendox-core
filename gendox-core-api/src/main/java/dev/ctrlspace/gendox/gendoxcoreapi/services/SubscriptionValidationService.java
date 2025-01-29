package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationPlan;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.*;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.DocumentPredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TimePeriodDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
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


    @Autowired
    public SubscriptionValidationService(@Value("${gendox.features.subscription-validation}") boolean isSubscriptionValidationEnabled,
                                         OrganizationPlanService organizationPlanService,
                                         DocumentInstanceRepository documentInstanceRepository,
                                         DocumentInstanceSectionRepository documentInstanceSectionRepository,
                                         InvitationRepository invitationRepository,
                                         TypeService typeService,
                                         OrganizationDailyUsageRepository organizationDailyUsageRepository,
                                         IntegrationRepository integrationRepository) {
        this.isSubscriptionValidationEnabled = isSubscriptionValidationEnabled;
        this.organizationPlanService = organizationPlanService;
        this.documentInstanceRepository = documentInstanceRepository;
        this.documentInstanceSectionRepository = documentInstanceSectionRepository;
        this.invitationRepository = invitationRepository;
        this.typeService = typeService;
        this.organizationDailyUsageRepository = organizationDailyUsageRepository;
        this.integrationRepository = integrationRepository;
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


}
