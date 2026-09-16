package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationModelProviderKey;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationPlan;
import dev.ctrlspace.gendox.gendoxcoreapi.model.SubscriptionPlan;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * The plan limits used here mirror the seeded plans, see
 * V20260911_120000__Reconcile_subscription_plans_with_pricing.sql.
 */
class SubscriptionValidationServiceTest {

    private static final UUID ORGANIZATION_ID = UUID.randomUUID();
    private static final AiModel COMPLETION_MODEL = new AiModel();
    private static final double PROVIDED_KEY_RATIO = 0.25;

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

    @BeforeEach
    void setUp() {
        organizationPlanService = mock(OrganizationPlanService.class);
        documentInstanceRepository = mock(DocumentInstanceRepository.class);
        invitationRepository = mock(InvitationRepository.class);
        typeService = mock(TypeService.class);
        organizationDailyUsageRepository = mock(OrganizationDailyUsageRepository.class);
        integrationRepository = mock(IntegrationRepository.class);
        projectRepository = mock(ProjectRepository.class);
        projectService = mock(ProjectService.class);
        organizationWebSiteRepository = mock(OrganizationWebSiteRepository.class);
        apiRateLimitService = mock(ApiRateLimitService.class);
        organizationModelKeyService = mock(OrganizationModelKeyService.class);
    }

    private SubscriptionValidationService service(boolean validationEnabled) {
        return new SubscriptionValidationService(validationEnabled,
                organizationPlanService,
                documentInstanceRepository,
                invitationRepository,
                typeService,
                organizationDailyUsageRepository,
                integrationRepository,
                projectRepository,
                projectService,
                organizationWebSiteRepository,
                apiRateLimitService,
                organizationModelKeyService,
                PROVIDED_KEY_RATIO);
    }

    /**
     * Registers an active plan for the organization, with the Free plan's seeded limits unless overridden.
     */
    private SubscriptionPlan activePlan(int numberOfSeats) {
        SubscriptionPlan subscriptionPlan = new SubscriptionPlan();
        subscriptionPlan.setSku("gd-free-001");
        subscriptionPlan.setUserUploadLimitFileCount(50);
        subscriptionPlan.setUserUploadLimitMb(100);
        subscriptionPlan.setUserMessageMonthlyLimitCount(200);
        subscriptionPlan.setDocumentPagesLimit(2500);
        subscriptionPlan.setProjectLimit(3);
        subscriptionPlan.setOrganizationWebSites(1);

        OrganizationPlan organizationPlan = new OrganizationPlan();
        organizationPlan.setSubscriptionPlan(subscriptionPlan);
        organizationPlan.setNumberOfSeats(numberOfSeats);
        organizationPlan.setStartDate(Instant.parse("2026-01-15T10:00:00Z"));

        when(organizationPlanService.getActiveOrganizationPlan(ORGANIZATION_ID)).thenReturn(organizationPlan);

        return subscriptionPlan;
    }

    private void usesOwnKeyForModel(boolean ownKey) {
        when(organizationModelKeyService.getKeyForModel(ORGANIZATION_ID, COMPLETION_MODEL))
                .thenReturn(ownKey ? new OrganizationModelProviderKey() : null);
    }

    private void documentUploads(long count) {
        when(organizationDailyUsageRepository.sumDocumentUploadsByOrganizationIdAndDateBetween(
                eq(ORGANIZATION_ID), any(Date.class), any(Date.class))).thenReturn(count);
    }

    private void messages(long count) {
        when(organizationDailyUsageRepository.sumMessagesByOrganizationIdAndDateBetween(
                eq(ORGANIZATION_ID), any(Date.class), any(Date.class))).thenReturn(count);
    }

    // ---------------------------------------------------------------- documents

    @Test
    void canCreateDocuments_underTheLimit_isAllowed() throws GendoxException {
        activePlan(1);
        documentUploads(49);

        assertTrue(service(true).canCreateDocuments(ORGANIZATION_ID));
    }

    @Test
    void canCreateDocuments_atTheLimit_isBlocked() throws GendoxException {
        activePlan(1);
        documentUploads(50);

        assertFalse(service(true).canCreateDocuments(ORGANIZATION_ID));
    }

    // the document cap reads the upload file count limit, not the message limit
    @Test
    void canCreateDocuments_readsTheUploadFileCountNotTheMessageLimit() throws GendoxException {
        SubscriptionPlan plan = activePlan(1);
        plan.setUserUploadLimitFileCount(50);
        plan.setUserMessageMonthlyLimitCount(200);
        documentUploads(60);

        assertFalse(service(true).canCreateDocuments(ORGANIZATION_ID));
    }

    @Test
    void canCreateDocuments_perSeatLimitIsMultipliedBySeats() throws GendoxException {
        activePlan(3);
        documentUploads(149);

        assertTrue(service(true).canCreateDocuments(ORGANIZATION_ID));
    }

    @Test
    void canCreateDocuments_isNotReducedByTheProvidedKeyRatio() throws GendoxException {
        activePlan(1);
        documentUploads(49);

        assertTrue(service(true).canCreateDocuments(ORGANIZATION_ID));
        verifyNoInteractions(organizationModelKeyService);
    }

    // ---------------------------------------------------------------- document pages

    @Test
    void canCreateDocumentPages_underTheLimit_isAllowed() throws GendoxException {
        activePlan(1);
        when(documentInstanceRepository.sumNumberOfPagesByOrganizationId(ORGANIZATION_ID)).thenReturn(2400L);

        assertTrue(service(true).canCreateDocumentPages(ORGANIZATION_ID, 100));
    }

    @Test
    void canCreateDocumentPages_incomingDocumentWouldExceedTheLimit_isBlocked() throws GendoxException {
        activePlan(1);
        when(documentInstanceRepository.sumNumberOfPagesByOrganizationId(ORGANIZATION_ID)).thenReturn(2400L);

        assertFalse(service(true).canCreateDocumentPages(ORGANIZATION_ID, 101));
    }

    @Test
    void canCreateDocumentPages_unknownPageCount_isBilledAsOnePage() throws GendoxException {
        activePlan(1);
        when(documentInstanceRepository.sumNumberOfPagesByOrganizationId(ORGANIZATION_ID)).thenReturn(2500L);

        assertFalse(service(true).canCreateDocumentPages(ORGANIZATION_ID, null));
    }

    @Test
    void canCreateDocumentPages_replacedByASmallerDocument_isAllowedAtTheLimit() throws GendoxException {
        activePlan(1);
        when(documentInstanceRepository.sumNumberOfPagesByOrganizationId(ORGANIZATION_ID)).thenReturn(2500L);

        assertTrue(service(true).canCreateDocumentPages(ORGANIZATION_ID, 90, 100));
    }

    // limits of 9999 and above are multiplied by seats like any other limit
    @Test
    void canCreateDocumentPages_limitAbove9999_isEnforced() throws GendoxException {
        SubscriptionPlan plan = activePlan(3);
        plan.setDocumentPagesLimit(25000);
        when(documentInstanceRepository.sumNumberOfPagesByOrganizationId(ORGANIZATION_ID)).thenReturn(75000L);

        assertFalse(service(true).canCreateDocumentPages(ORGANIZATION_ID, 1));
    }

    // ---------------------------------------------------------------- messages

    @Test
    void canSendMessage_withOwnKeyForModel_atTheLimit_isBlocked() throws GendoxException {
        activePlan(1);
        usesOwnKeyForModel(true);
        messages(199);

        assertTrue(service(true).canSendMessage(ORGANIZATION_ID, COMPLETION_MODEL));

        messages(200);
        assertFalse(service(true).canSendMessage(ORGANIZATION_ID, COMPLETION_MODEL));
    }

    @Test
    void canSendMessage_withoutOwnKeyForModel_getsTheReducedAllowance() throws GendoxException {
        activePlan(1);
        usesOwnKeyForModel(false);
        // 25% of 200 messages
        messages(49);

        assertTrue(service(true).canSendMessage(ORGANIZATION_ID, COMPLETION_MODEL));

        messages(50);
        assertFalse(service(true).canSendMessage(ORGANIZATION_ID, COMPLETION_MODEL));
    }

    // ---------------------------------------------------------------- projects

    @Test
    void canCreateProjects_atTheLimit_isBlocked() {
        activePlan(1);
        when(projectRepository.countActiveProjectsByOrganizationId(ORGANIZATION_ID)).thenReturn(3L);

        assertFalse(service(true).canCreateProjects(ORGANIZATION_ID));
    }

    @Test
    void canCreateProjects_fairUsageLimitIsMultipliedBySeats() {
        SubscriptionPlan plan = activePlan(3);
        plan.setProjectLimit(9999);
        when(projectRepository.countActiveProjectsByOrganizationId(ORGANIZATION_ID)).thenReturn(29_996L);

        assertTrue(service(true).canCreateProjects(ORGANIZATION_ID));

        when(projectRepository.countActiveProjectsByOrganizationId(ORGANIZATION_ID)).thenReturn(29_997L);
        assertFalse(service(true).canCreateProjects(ORGANIZATION_ID));
    }

    @Test
    void canCreateProjects_planLimitIsNull_isBlocked() {
        SubscriptionPlan plan = activePlan(1);
        plan.setProjectLimit(null);
        when(projectRepository.countActiveProjectsByOrganizationId(ORGANIZATION_ID)).thenReturn(0L);

        assertFalse(service(true).canCreateProjects(ORGANIZATION_ID));
    }

    // ---------------------------------------------------------------- websites

    @Test
    void canCreateWebsite_atTheLimit_isBlocked() {
        activePlan(1);
        when(organizationWebSiteRepository.countByOrganizationId(ORGANIZATION_ID)).thenReturn(1L);

        assertFalse(service(true).canCreateWebsite(ORGANIZATION_ID));
    }

    @Test
    void canCreateWebsite_underTheLimit_isAllowed() {
        activePlan(1);
        when(organizationWebSiteRepository.countByOrganizationId(ORGANIZATION_ID)).thenReturn(0L);

        assertTrue(service(true).canCreateWebsite(ORGANIZATION_ID));
    }

    // ---------------------------------------------------------------- kill switch

    @Test
    void everyCheck_whenSubscriptionValidationIsDisabled_isAllowedWithoutReadingAnything() throws GendoxException {
        SubscriptionValidationService service = service(false);

        assertTrue(service.canCreateDocuments(ORGANIZATION_ID));
        assertTrue(service.canCreateDocumentsSize(ORGANIZATION_ID, 1));
        assertTrue(service.canCreateDocumentPages(ORGANIZATION_ID, 10_000));
        assertTrue(service.canSendMessage(ORGANIZATION_ID, COMPLETION_MODEL));
        assertTrue(service.canInviteUsers(ORGANIZATION_ID));
        assertTrue(service.canCreateIntegrations(ORGANIZATION_ID));
        assertTrue(service.canCreateWebsite(ORGANIZATION_ID));
        assertTrue(service.canCreateProjects(ORGANIZATION_ID));

        verifyNoInteractions(organizationPlanService,
                documentInstanceRepository,
                invitationRepository,
                organizationDailyUsageRepository,
                integrationRepository,
                projectRepository,
                projectService,
                organizationWebSiteRepository,
                organizationModelKeyService);
    }
}
