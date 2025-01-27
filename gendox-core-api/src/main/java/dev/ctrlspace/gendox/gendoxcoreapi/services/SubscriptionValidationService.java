package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationPlan;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ProjectCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.DocumentInstanceRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.DocumentInstanceSectionRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.MessageRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.DocumentPredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.ProjectPredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TimePeriodDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class SubscriptionValidationService {

    Logger logger = LoggerFactory.getLogger(SubscriptionValidationService.class);

    private OrganizationPlanService organizationPlanService;
    private DocumentInstanceRepository documentInstanceRepository;
    private DocumentInstanceSectionRepository documentInstanceSectionRepository;
    private ProjectRepository projectRepository;
    private MessageRepository messageRepository;


    @Autowired
    public SubscriptionValidationService(OrganizationPlanService organizationPlanService,
                                         DocumentInstanceRepository documentInstanceRepository,
                                         DocumentInstanceSectionRepository documentInstanceSectionRepository,
                                         ProjectRepository projectRepository,
                                         MessageRepository messageRepository) {
        this.organizationPlanService = organizationPlanService;
        this.documentInstanceRepository = documentInstanceRepository;
        this.documentInstanceSectionRepository = documentInstanceSectionRepository;
        this.projectRepository = projectRepository;
        this.messageRepository = messageRepository;
    }


    // check for the number of websites allowed for the organization
    public boolean canCreateWebsite(UUID organizationId, Integer numberOfWebsites) {
        OrganizationPlan activePlan = organizationPlanService.getActiveOrganizationPlan(organizationId);
        Integer maxWebsites = activePlan.getSubscriptionPlan().getOrganizationWebSites() * activePlan.getNumberOfSeats();

        return numberOfWebsites < maxWebsites;
    }

    // check for the Document Sections allowed for the organization
    public boolean canCreateDocumentSections(UUID organizationId) throws GendoxException {
        OrganizationPlan activePlan = organizationPlanService.getActiveOrganizationPlan(organizationId);
        int maxDocumentSections = activePlan.getSubscriptionPlan().getUserUploadLimitFileCount() * activePlan.getNumberOfSeats();
        int numberOfDocumentSections = this.countDocumentInstanceSections(this.getDocumentsByOrganizationIdAndTimePeriod(organizationId, activePlan.getStartDate(), activePlan.getEndDate()));

        return numberOfDocumentSections < maxDocumentSections;
    }

    // check for the Documents allowed for the organization
    public boolean canCreateDocuments(UUID organizationId) throws GendoxException {
        OrganizationPlan activePlan = organizationPlanService.getActiveOrganizationPlan(organizationId);
        int maxDocuments = activePlan.getSubscriptionPlan().getUserMessageMonthlyLimitCount() * activePlan.getNumberOfSeats();
        int numberOfDocuments = (int) this.getDocumentsByOrganizationIdAndTimePeriod(organizationId, activePlan.getStartDate(), activePlan.getEndDate()).getTotalElements();
        return numberOfDocuments < maxDocuments;
    }

    // check for the messages allowed for the organization
    public boolean canSendMessage(UUID organizationId) throws GendoxException {
        OrganizationPlan activePlan = organizationPlanService.getActiveOrganizationPlan(organizationId);
        int maxMessages = activePlan.getSubscriptionPlan().getUserUploadLimitFileCount() * activePlan.getNumberOfSeats();
        int numberOfMessages = this.countMessages(organizationId, activePlan.getStartDate(), activePlan.getEndDate());
        return numberOfMessages < maxMessages;
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


    public Integer countMessages(UUID organizationId, Instant startDate, Instant endDate) throws GendoxException {
        Page<Project> Projects = projectRepository.findAll(ProjectPredicates.build(
                ProjectCriteria.builder().organizationId(organizationId.toString()).build()), PageRequest.of(0, 100));

        Set<UUID> projectIds = Projects.getContent().stream()
                .map(Project::getId)
                .collect(Collectors.toSet());

        return (int) messageRepository.countMessagesByProjectIdsAndDateRange(projectIds, startDate, endDate);
    }


}
