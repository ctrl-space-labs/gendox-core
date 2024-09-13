package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.ApiRateLimit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ApiRateLimitRepository extends JpaRepository<ApiRateLimit, UUID> {

    public ApiRateLimit findByTierTypeName(String tierTypeName);
}
