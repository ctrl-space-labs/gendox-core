package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Invitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.List;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvitationRepository extends JpaRepository<Invitation, UUID>, QuerydslPredicateExecutor<Invitation> {


    public Boolean existsByIdAndExpiresAtAfter(UUID id, Instant time);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    public Optional<Invitation> findByInviteeEmailAndToken(String inviteeEmail, String token);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Invitation i WHERE lower(i.inviteeEmail) = lower(:email) "
            + "AND i.statusType.name = 'ACCEPTED' AND i.token <> ''")
    List<Invitation> lockAcceptedInvitations(@Param("email") String email);

    long countByOrganizationIdAndStatusTypeId(UUID organizationId, Long statusTypeId);

}
