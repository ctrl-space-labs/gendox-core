package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Organization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.model.UserOrganization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserOrganizationRepository extends JpaRepository<UserOrganization, UUID>, QuerydslPredicateExecutor<UserOrganization> {

    public List<UserOrganization> findByUserId(UUID userId);

    boolean existsByUserIdAndOrganizationId(UUID userId, UUID organizationId);

    public List<UserOrganization> findByOrganizationId(UUID organizationId);

    long countByUserId(UUID userId);

    @Query("SELECT uo FROM UserOrganization uo WHERE uo.user.id = :userId AND uo.organization.id = :organizationId")
    UserOrganization findByUserIdAndOrganizationId(UUID userId, UUID organizationId);

    void deleteByOrganizationId(UUID organizationId);


    @Query(value = "SELECT * FROM gendox_core.user_organization uo WHERE uo.user_id = :userId " +
            "AND uo.organization_role_id = (SELECT id FROM gendox_core.types WHERE name = :role) " +
            "ORDER BY uo.created_at ASC LIMIT 1",
            nativeQuery = true)
    Optional<UserOrganization> findFirstByUserIdAndRoleNative(@Param("userId") UUID userId, @Param("role") String role);

    @Query(value = "SELECT uo FROM UserOrganization uo WHERE uo.user.id = :userId AND uo.organization.id = :organizationId ORDER BY uo.createdAt ASC LIMIT 1", nativeQuery = true)
    Optional<UserOrganization> findFirstByUserIdAndOrganizationIdOrderByCreatedAtAsc(@Param("userId") UUID userId, @Param("organizationId") UUID organizationId);

}
