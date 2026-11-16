package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ArtifactShareCriteria;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ArtifactSharePredicatesTest {

    private final UUID reader = UUID.randomUUID();
    private final UUID organizationId = UUID.randomUUID();
    private final UUID readersProject = UUID.randomUUID();
    private final UUID readersOtherProject = UUID.randomUUID();
    private final Instant now = Instant.parse("2026-11-16T12:00:00Z");

    private ArtifactShareCriteria.ArtifactShareCriteriaBuilder complete() {
        return ArtifactShareCriteria.builder()
                .readerId(reader).organizationId(organizationId).readerProjectIds(List.of(readersProject, readersOtherProject)).activeAt(now);
    }

    @Test
    void withoutTheReaderTheOrganizationOrTheMomentTheListMatchesNothing() {
        assertTrue(ArtifactSharePredicates.build(complete().readerId(null).build()).toString().contains("false"));
        assertTrue(ArtifactSharePredicates.build(complete().organizationId(null).build()).toString().contains("false"));
        assertTrue(ArtifactSharePredicates.build(complete().activeAt(null).build()).toString().contains("false"));
    }

    @Test
    void sharesWithTheReaderOrWithTheirProjectsButNeverTheirOwn() {
        String predicate = ArtifactSharePredicates.build(complete().build()).toString();

        assertTrue(predicate.contains("artifactShare.sharedWithUserId = " + reader), predicate);
        assertTrue(predicate.contains("artifactShare.sharedWithUserId is null"), predicate);
        assertTrue(predicate.contains("artifactShare.artifact.projectId in [" + readersProject + ", " + readersOtherProject + "]"), predicate);
        assertTrue(predicate.contains("artifactShare.createdBy != " + reader), predicate);
        assertFalse(predicate.contains("false"), predicate);
    }

    @Test
    void withoutProjectsOnlyTheSharesWithTheReaderByNameCount() {
        String predicate = ArtifactSharePredicates.build(complete().readerProjectIds(List.of()).build()).toString();

        assertTrue(predicate.contains("artifactShare.sharedWithUserId = " + reader), predicate);
        assertFalse(predicate.contains("artifactShare.sharedWithUserId is null"), predicate);
    }

    @Test
    void onlySharesNotStoppedAndNotEnded() {
        String predicate = ArtifactSharePredicates.build(complete().build()).toString();

        assertTrue(predicate.contains("artifactShare.revokedAt is null"), predicate);
        assertTrue(predicate.contains("artifactShare.expiresAt is null || artifactShare.expiresAt > " + now), predicate);
    }

    @Test
    void anAgentsListNarrowsToItsProjectAndTheTypeMatchesInAnyCase() {
        UUID agent = UUID.randomUUID();
        String predicate = ArtifactSharePredicates.build(complete().projectId(agent).artifactType("svg").search(" flow ").build()).toString();

        assertTrue(predicate.contains("artifactShare.artifact.projectId = " + agent), predicate);
        assertTrue(predicate.contains("artifactShare.artifact.artifactType.name = SVG"), predicate);
        assertTrue(predicate.contains("flow"), predicate);
    }
}
