package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Organization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.model.UserOrganization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;

import java.util.List;
import java.util.UUID;

public interface UserOrganizationRepository extends JpaRepository<UserOrganization, UUID>, QuerydslPredicateExecutor<UserOrganization> {

    public List<UserOrganization> findByUserId(UUID userId);

    boolean existsByUserAndOrganization(User user, Organization organization);

}
