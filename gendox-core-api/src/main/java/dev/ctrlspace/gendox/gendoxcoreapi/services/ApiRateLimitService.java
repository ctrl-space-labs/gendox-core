package dev.ctrlspace.gendox.gendoxcoreapi.services;


import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.slf4j.Logger;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class ApiRateLimitService {

    Logger logger = org.slf4j.LoggerFactory.getLogger(getClass());
    /**
     * Gets a new bucket for the user, OR returns the existing bucket from the cache.
     *
     * @param userId it can be the user ID or the IP address.
     * @param requests
     * @param durationMinutes
     * @return
     */
    @Cacheable(value = "SubscriptionService#getRateLimitBucketForUser", key = "#userId")
    public Bucket getRateLimitBucketForUser(String userId, int requests, int durationMinutes) {

        logger.debug("Creating new rate limit bucket for user: {} with requests: {} and duration: {} minutes", userId, requests, durationMinutes);

        Bandwidth limit = Bandwidth
                .builder()
                .capacity(requests)
                .refillGreedy(requests, Duration.ofMinutes(durationMinutes))
                .id(userId)
                .build();
        return Bucket.builder().addLimit(limit).build();
    }


}
