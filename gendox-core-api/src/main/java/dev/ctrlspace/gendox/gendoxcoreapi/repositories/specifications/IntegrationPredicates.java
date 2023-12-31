package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;
import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import com.querydsl.core.util.StringUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QIntegration;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.IntegrationCriteria;

import java.util.UUID;
public class IntegrationPredicates {

    private static QIntegration qIntegration = QIntegration.integration;

    public static Predicate build(IntegrationCriteria criteria) {
        return ExpressionUtils.allOf(
                projectId(criteria.getProjectId()),
                directoryPath(criteria.getDirectoryPath()),
                url(criteria.getUrl()),
                repoHead(criteria.getRepoHead())
        );
    }

    private static Predicate projectId(String projectId) {
        if (StringUtils.isNullOrEmpty(projectId)) {
            return null;
        }
        return qIntegration.projectId.eq(UUID.fromString(projectId));
    }

    private static Predicate directoryPath(String directoryPath) {
        if (StringUtils.isNullOrEmpty(directoryPath)) {
            return null;
        }
        return qIntegration.directoryPath.eq(directoryPath);
    }

    private static Predicate url(String url) {
        if (StringUtils.isNullOrEmpty(url)) {
            return null;
        }
        return qIntegration.url.eq(url);
    }

    private static Predicate repoHead(String repoHead) {
        if (StringUtils.isNullOrEmpty(repoHead)) {
            return null;
        }
        return qIntegration.repoHead.eq(repoHead);
    }


}
