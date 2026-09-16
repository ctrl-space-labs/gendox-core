package dev.ctrlspace.gendox.gendoxcoreapi.utils;

import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TimePeriodDTO;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;

/**
 * Time windows used when counting subscription usage.
 */
public class BillingWindowUtils {

    private BillingWindowUtils() {
    }

    /**
     * The monthly billing period that contains now, for a subscription anchored at the given instant.
     * <p>
     * Every period is computed from the anchor, not from the previous period, the same way Stripe does.
     * When the anchor day does not exist in a month the period starts on the last day of that month,
     * e.g. an anchor on Jan 31 renews on Feb 28 (Feb 29 in leap years) and then on Mar 31.
     *
     * @param anchor the start of the subscription
     * @param clock  the clock to read the current time from
     * @return the period from its start, inclusive, until the start of the next period, exclusive
     */
    public static TimePeriodDTO currentBillingPeriod(Instant anchor, Clock clock) {
        ZonedDateTime start = anchor.atZone(ZoneOffset.UTC);
        ZonedDateTime now = ZonedDateTime.now(clock.withZone(ZoneOffset.UTC));

        long months = ChronoUnit.MONTHS.between(start, now);
        // the month difference falls one short when the anchor day does not exist in the current month
        while (!start.plusMonths(months + 1).isAfter(now)) {
            months++;
        }

        return new TimePeriodDTO(start.plusMonths(months).toInstant(), start.plusMonths(months + 1).toInstant());
    }
}
