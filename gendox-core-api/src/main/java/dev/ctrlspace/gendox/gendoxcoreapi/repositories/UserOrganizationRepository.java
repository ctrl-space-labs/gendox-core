package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.UserOrganization;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface UserOrganizationRepository extends JpaRepository<UserOrganization, UUID> {

    public List<UserOrganization> findByUserId(UUID userId);
}
