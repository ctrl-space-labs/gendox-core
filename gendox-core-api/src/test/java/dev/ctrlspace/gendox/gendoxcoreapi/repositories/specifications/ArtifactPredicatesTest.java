package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import com.querydsl.core.types.Expression;
import com.querydsl.core.types.Operation;
import com.querydsl.core.types.Predicate;
import com.querydsl.core.types.SubQueryExpression;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ArtifactCriteria;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ArtifactPredicatesTest {

    private final UUID projectId = UUID.randomUUID();
    private final UUID me = UUID.randomUUID();

    // the where of the membership subquery, which the predicate's own text leaves out
    private static String subqueryWhereOf(Expression<?> expression) {
        if (expression instanceof SubQueryExpression<?> subquery) return String.valueOf(subquery.getMetadata().getWhere());
        if (expression instanceof Operation<?> operation) {
            return operation.getArgs().stream().map(ArtifactPredicatesTest::subqueryWhereOf)
                    .filter(where -> !where.isEmpty()).findFirst().orElse("");
        }
        return "";
    }

    @Test
    void withoutAUserTheListMatchesNothing() {
        String predicate = ArtifactPredicates.build(ArtifactCriteria.builder().projectId(projectId).build()).toString();

        assertTrue(predicate.contains("false"), predicate);
        assertFalse(predicate.contains("chatThreadMember"), predicate);
    }

    @Test
    void withoutAProjectTheListMatchesNothing() {
        String predicate = ArtifactPredicates.build(ArtifactCriteria.builder().memberId(me).build()).toString();

        assertTrue(predicate.contains("false"), predicate);
    }

    @Test
    void theListIsTheUsersConversationsInTheProject() {
        Predicate built = ArtifactPredicates.build(ArtifactCriteria.builder().projectId(projectId).memberId(me).build());
        String predicate = built.toString();

        assertTrue(predicate.contains("artifact.projectId = " + projectId), predicate);
        assertTrue(predicate.contains("artifact.threadId in"), predicate);
        assertTrue(subqueryWhereOf(built).contains("chatThreadMember.userId = " + me), subqueryWhereOf(built));
        assertFalse(predicate.contains("false"), predicate);
    }

    @Test
    void theTypeIsMatchedInAnyCase() {
        String predicate = ArtifactPredicates.build(ArtifactCriteria.builder()
                .projectId(projectId).memberId(me).artifactType("html").search(" policy ").build()).toString();

        assertTrue(predicate.contains("artifact.artifactType.name = HTML"), predicate);
        assertTrue(predicate.contains("policy"), predicate);
    }
}
