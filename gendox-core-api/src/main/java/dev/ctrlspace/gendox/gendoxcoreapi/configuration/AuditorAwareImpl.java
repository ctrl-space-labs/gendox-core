package dev.ctrlspace.gendox.gendoxcoreapi.configuration;

import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import org.slf4j.Logger;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.UUID;

public class AuditorAwareImpl implements AuditorAware<UUID> {

    Logger logger = org.slf4j.LoggerFactory.getLogger(AuditorAwareImpl.class);

    @Override
    public Optional<UUID> getCurrentAuditor() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UUID userId = UUID.fromString(((UserProfile) authentication.getPrincipal()).getId());
            return Optional.ofNullable(userId);
        } catch (Exception e){
            logger.warn("An exception occurred while trying to get the user ID: " + e.getMessage());
            return null;
        }
    }
}
