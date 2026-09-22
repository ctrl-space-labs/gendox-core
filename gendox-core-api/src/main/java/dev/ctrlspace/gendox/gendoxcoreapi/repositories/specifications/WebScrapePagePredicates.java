package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import com.querydsl.core.util.StringUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QWebScrapePage;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.WebScrapePageCriteria;

import java.util.UUID;

public class WebScrapePagePredicates {
    private static QWebScrapePage qWebScrapePage = QWebScrapePage.webScrapePage;

    public static Predicate build(WebScrapePageCriteria criteria) {
        return ExpressionUtils.allOf(
                integrationId(criteria.getIntegrationId()),
                status(criteria.getStatus()),
                isSelected(criteria.getIsSelected())
        );
    }

    private static Predicate integrationId(String integrationId) {
        if (StringUtils.isNullOrEmpty(integrationId)) {
            return null;
        }
        return qWebScrapePage.integrationId.eq(UUID.fromString(integrationId));
    }

    private static Predicate status(String status) {
        if (StringUtils.isNullOrEmpty(status)) {
            return null;
        }
        return qWebScrapePage.status.eq(status);
    }

    private static Predicate isSelected(Boolean isSelected) {
        if (isSelected == null) {
            return null;
        }
        return qWebScrapePage.isSelected.eq(isSelected);
    }
}
