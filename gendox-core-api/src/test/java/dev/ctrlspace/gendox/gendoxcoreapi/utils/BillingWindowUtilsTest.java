package dev.ctrlspace.gendox.gendoxcoreapi.utils;

import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TimePeriodDTO;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertEquals;

class BillingWindowUtilsTest {

    private static TimePeriodDTO period(String anchor, String now) {
        return BillingWindowUtils.currentBillingPeriod(Instant.parse(anchor), Clock.fixed(Instant.parse(now), ZoneOffset.UTC));
    }

    private static void assertPeriod(TimePeriodDTO period, String from, String to) {
        assertEquals(Instant.parse(from), period.from());
        assertEquals(Instant.parse(to), period.to());
    }

    @Test
    void midPeriod_startsOnTheAnchorDayOfTheCurrentMonth() {
        assertPeriod(period("2026-07-15T10:00:00Z", "2026-09-18T08:00:00Z"),
                "2026-09-15T10:00:00Z", "2026-10-15T10:00:00Z");
    }

    @Test
    void anchorDayBeforeTheAnchorTime_isStillThePreviousPeriod() {
        assertPeriod(period("2026-07-15T10:00:00Z", "2026-09-15T09:59:59.999Z"),
                "2026-08-15T10:00:00Z", "2026-09-15T10:00:00Z");
    }

    @Test
    void exactlyAtTheAnchorTime_isTheNewPeriod() {
        assertPeriod(period("2026-07-15T10:00:00Z", "2026-09-15T10:00:00Z"),
                "2026-09-15T10:00:00Z", "2026-10-15T10:00:00Z");
    }

    @Test
    void firstPeriod_startsAtTheAnchor() {
        assertPeriod(period("2026-07-15T10:00:00Z", "2026-07-20T00:00:00Z"),
                "2026-07-15T10:00:00Z", "2026-08-15T10:00:00Z");
    }

    @Test
    void anchorOn31stOfJanuary_renewsOnTheLastDayOfFebruary() {
        assertPeriod(period("2026-01-31T10:00:00Z", "2026-02-28T12:00:00Z"),
                "2026-02-28T10:00:00Z", "2026-03-31T10:00:00Z");
    }

    @Test
    void anchorOn31stOfJanuary_returnsToThe31stAfterFebruary() {
        assertPeriod(period("2026-01-31T10:00:00Z", "2026-04-01T00:00:00Z"),
                "2026-03-31T10:00:00Z", "2026-04-30T10:00:00Z");
    }

    @Test
    void anchorOn31stOfJanuary_leapYear_renewsOnThe29thOfFebruary() {
        assertPeriod(period("2028-01-31T10:00:00Z", "2028-02-29T12:00:00Z"),
                "2028-02-29T10:00:00Z", "2028-03-31T10:00:00Z");
    }

    @Test
    void anchorOnLeapDay_renewsOnThe28thOfFebruaryInNonLeapYears() {
        assertPeriod(period("2028-02-29T10:00:00Z", "2029-02-28T12:00:00Z"),
                "2029-02-28T10:00:00Z", "2029-03-29T10:00:00Z");
    }

    @Test
    void anchorOnLeapDay_returnsToThe29thInTheFollowingMonths() {
        assertPeriod(period("2028-02-29T10:00:00Z", "2028-03-30T00:00:00Z"),
                "2028-03-29T10:00:00Z", "2028-04-29T10:00:00Z");
    }

    @Test
    void anchorOnTheFirstOfTheMonth_followsCalendarMonths() {
        assertPeriod(period("2026-01-01T00:00:00Z", "2026-12-31T23:59:59Z"),
                "2026-12-01T00:00:00Z", "2027-01-01T00:00:00Z");
    }

    @Test
    void yearlySubscription_isSplitIntoMonthlyPeriods() {
        assertPeriod(period("2025-11-30T00:00:00Z", "2026-09-14T00:00:00Z"),
                "2026-08-30T00:00:00Z", "2026-09-30T00:00:00Z");
    }
}
