package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import com.querydsl.core.types.Expression;
import com.querydsl.core.types.Operation;
import com.querydsl.core.types.Predicate;
import com.querydsl.core.types.SubQueryExpression;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ArtifactCriteria;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ArtifactPredicatesTest {

    private final UUID projectId = UUID.randomUUID();
    private final UUID me = UUID.randomUUID();

    // the where of every subquery, which the predicate's own text leaves out
    private static List<String> subqueryWheresOf(Expression<?> expression) {
        List<String> wheres = new ArrayList<>();
        if (expression instanceof SubQueryExpression<?> subquery) {
            wheres.add(String.valueOf(subquery.getMetadata().getWhere()));
        } else if (expression instanceof Operation<?> operation) {
            operation.getArgs().forEach(arg -> wheres.addAll(subqueryWheresOf(arg)));
        }
        return wheres;
    }

    private static Predicate yours(ArtifactCriteria.ArtifactCriteriaBuilder criteria) {
        return ArtifactPredicates.build(criteria.build());
    }

    private static Predicate sharedWithMe(ArtifactCriteria.ArtifactCriteriaBuilder criteria) {
        return ArtifactPredicates.build(criteria.sharedWithMe(true).build());
    }

    @Test
    void withoutAUserNeitherListMatchesAnything() {
        String own = yours(ArtifactCriteria.builder().projectId(projectId)).toString();
        String shared = sharedWithMe(ArtifactCriteria.builder().projectId(projectId)).toString();

        assertTrue(own.contains("false"), own);
        assertTrue(shared.contains("false"), shared);
    }

    @Test
    void withoutAProjectNeitherListMatchesAnything() {
        String own = yours(ArtifactCriteria.builder().userId(me)).toString();
        String shared = sharedWithMe(ArtifactCriteria.builder().userId(me)).toString();

        assertTrue(own.contains("false"), own);
        assertTrue(shared.contains("false"), shared);
    }

    @Test
    void yoursAreTheUsersOwnInTheProject() {
        Predicate built = yours(ArtifactCriteria.builder().projectId(projectId).userId(me));
        String predicate = built.toString();

        assertTrue(predicate.contains("artifact.projectId = " + projectId), predicate);
        assertTrue(predicate.contains("artifact.ownerId = " + me), predicate);
        assertFalse(predicate.contains("false"), predicate);
    }

    @Test
    void yoursKeepADeletedConversationsArtifactOnlyWhileItIsShared() {
        Predicate built = yours(ArtifactCriteria.builder().projectId(projectId).userId(me));
        String predicate = built.toString();
        List<String> wheres = subqueryWheresOf(built);

        assertTrue(wheres.stream().anyMatch(where -> where.contains("chatThread.isActive = true")), wheres.toString());
        assertTrue(predicate.contains("artifact.generalAccessRole is not null"), predicate);
        assertTrue(predicate.contains("artifact.publicId is not null"), predicate);
    }

    @Test
    void sharedWithMeAreTheOthersArtifactsIHaveARoleOn() {
        Predicate built = sharedWithMe(ArtifactCriteria.builder().projectId(projectId).userId(me));
        String predicate = built.toString();
        List<String> wheres = subqueryWheresOf(built);

        assertTrue(predicate.contains("artifact.projectId = " + projectId), predicate);
        assertTrue(predicate.contains("artifact.ownerId != " + me), predicate);
        assertTrue(predicate.contains("artifact.generalAccessRole is not null"), predicate);
        assertTrue(wheres.stream().anyMatch(where -> where.contains("artifactMember.userId = " + me)), wheres.toString());
        assertFalse(predicate.contains("false"), predicate);
    }

    @Test
    void sharedWithMeNeedsMembershipOfTheAgent() {
        List<String> wheres = subqueryWheresOf(sharedWithMe(ArtifactCriteria.builder().projectId(projectId).userId(me)));

        assertTrue(wheres.stream().anyMatch(where -> where.contains("projectMember.project.id = " + projectId)
                && where.contains("projectMember.user.id = " + me)), wheres.toString());
    }

    @Test
    void theTypeIsMatchedInAnyCase() {
        String predicate = yours(ArtifactCriteria.builder()
                .projectId(projectId).userId(me).artifactType("html").search(" policy ")).toString();

        assertTrue(predicate.contains("artifact.artifactType.name = HTML"), predicate);
        assertTrue(predicate.contains("policy"), predicate);
    }
}