package dev.ctrlspace.gendox.spring.batch.utils;

import brave.internal.Nullable;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TimePeriodDTO;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.UUID;

public class TimePeriodUtils {

    public static TimePeriodAndOverride prepareTimePeriodAndOverride(
            JobUtils jobUtils, String jobName, @Nullable TimePeriodDTO timePeriod, @Nullable UUID projectId) throws GendoxException {

        Instant now = Instant.now();
        if (timePeriod != null) {
            validateTimePeriod(timePeriod, now);
            return new TimePeriodAndOverride(timePeriod, true, now);
        } else {
            Instant start = jobUtils.getLastCompletedJobTime(jobName, now, projectId, false);
            return new TimePeriodAndOverride(new TimePeriodDTO(start, now), false, now);
        }
    }

    public record TimePeriodAndOverride(TimePeriodDTO timePeriod, boolean override, Instant now) {}


    /**
     * Validates the time period DTO to ensure 'from' and 'to' dates are set correctly.
     *
     * @param timePeriod The TimePeriodDTO to validate.
     * @param now        The current time, used for validation against future dates.
     * @throws GendoxException if validation fails.
     */
    public static void validateTimePeriod(TimePeriodDTO timePeriod, Instant now) throws GendoxException {

        if (timePeriod.from() == null) {
            throw new GendoxException("TIME_PERIOD_FROM_NULL", "'from' field cannot be null", HttpStatus.BAD_REQUEST);
        }
        if (timePeriod.to() == null) {
            throw new GendoxException("TIME_PERIOD_TO_NULL", "'to' field cannot be null", HttpStatus.BAD_REQUEST);
        }
        if (timePeriod.from().isAfter(timePeriod.to())) {
            throw new GendoxException("TIME_PERIOD_FROM_AFTER_TO", "'from' date must be before or equal to 'to' date", HttpStatus.BAD_REQUEST);
        }
        if (timePeriod.from().isAfter(now)) {
            throw new GendoxException("TIME_PERIOD_FROM_IN_FUTURE", "'from' date cannot be in the future", HttpStatus.BAD_REQUEST);
        }
        if (timePeriod.to().isAfter(now)) {
            throw new GendoxException("TIME_PERIOD_TO_IN_FUTURE", "'to' date cannot be in the future", HttpStatus.BAD_REQUEST);
        }
    }




}
