package dev.ctrlspace.gendox.gendoxcoreapi.services;

import com.querydsl.core.types.Predicate;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.SubscriptionNotificationConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationPlan;
import dev.ctrlspace.gendox.gendoxcoreapi.model.SubscriptionPlan;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.OrganizationPlanRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.BillingWindowUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotSame;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class OrganizationPlanServiceTest {

    private static final UUID ORGANIZATION_ID = UUID.randomUUID();
    private static final Instant DEFAULT_FREE_PLAN_START = Instant.parse("2026-09-01T00:00:00Z");

    private OrganizationPlanRepository organizationPlanRepository;
    private OrganizationPlanService organizationPlanService;
    private OrganizationPlan defaultFreePlan;

    @BeforeEach
    void setUp() {
        organizationPlanRepository = mock(OrganizationPlanRepository.class);
        SubscriptionPlanService subscriptionPlanService = mock(SubscriptionPlanService.class);
        organizationPlanService = new OrganizationPlanService(organizationPlanRepository, subscriptionPlanService, mock(SubscriptionNotificationConverter.class));

        defaultFreePlan = new OrganizationPlan();
        defaultFreePlan.setSubscriptionPlan(new SubscriptionPlan());
        defaultFreePlan.setNumberOfSeats(1);
        defaultFreePlan.setStartDate(DEFAULT_FREE_PLAN_START);
        defaultFreePlan.setEndDate(Instant.parse("2027-09-01T00:00:00Z"));
        when(subscriptionPlanService.createDefaultFreePlan()).thenReturn(defaultFreePlan);
    }

    private void activePlans(OrganizationPlan... plans) {
        Page<OrganizationPlan> page = new PageImpl<>(List.of(plans));
        when(organizationPlanRepository.findAll(any(Predicate.class), any(Pageable.class))).thenReturn(page);
    }

    private void previousPlan(OrganizationPlan plan) {
        when(organizationPlanRepository.findMostRecentlyEndedPlan(eq(ORGANIZATION_ID), any(Instant.class)))
                .thenReturn(Optional.ofNullable(plan));
    }

    @Test
    void getActiveOrganizationPlan_withActivePlan_returnsIt() {
        OrganizationPlan activePlan = new OrganizationPlan();
        activePlans(activePlan);

        assertSame(activePlan, organizationPlanService.getActiveOrganizationPlan(ORGANIZATION_ID));
    }

    @Test
    void getActiveOrganizationPlan_neverHadAPlan_returnsTheDefaultFreePlan() {
        activePlans();
        previousPlan(null);

        assertSame(defaultFreePlan, organizationPlanService.getActiveOrganizationPlan(ORGANIZATION_ID));
    }

    @Test
    void getActiveOrganizationPlan_afterAPlanEnded_freePlanStartsAtItsEnd() {
        activePlans();
        OrganizationPlan endedPlan = new OrganizationPlan();
        endedPlan.setStartDate(Instant.parse("2026-07-15T10:00:00Z"));
        endedPlan.setEndDate(Instant.parse("2026-08-20T14:00:00Z"));
        previousPlan(endedPlan);

        OrganizationPlan freePlan = organizationPlanService.getActiveOrganizationPlan(ORGANIZATION_ID);

        assertNotSame(defaultFreePlan, freePlan);
        assertSame(defaultFreePlan.getSubscriptionPlan(), freePlan.getSubscriptionPlan());
        assertEquals(Instant.parse("2026-08-20T14:00:00Z"), freePlan.getStartDate());
        assertEquals(BillingWindowUtils.currentBillingPeriod(endedPlan.getEndDate(), Clock.systemUTC()).to(), freePlan.getEndDate());
        // the cached default free plan is shared by all organizations and must stay untouched
        assertEquals(DEFAULT_FREE_PLAN_START, defaultFreePlan.getStartDate());
    }
}
