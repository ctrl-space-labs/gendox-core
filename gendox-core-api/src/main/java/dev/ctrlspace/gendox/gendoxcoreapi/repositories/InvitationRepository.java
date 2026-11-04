package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Invitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvitationRepository extends JpaRepository<Invitation, UUID>, QuerydslPredicateExecutor<Invitation> {


    public Boolean existsByIdAndExpiresAtAfter(UUID id, Instant time);

    public Optional<Invitation> findByInviteeEmailAndToken(String inviteeEmail, String token);

    long countByOrganizationIdAndStatusTypeId(UUID organizationId, Long statusTypeId);

}
