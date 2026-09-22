package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.WebScrapePage;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WebScrapePageRepository extends JpaRepository<WebScrapePage, UUID>, QuerydslPredicateExecutor<WebScrapePage> {

    Optional<WebScrapePage> findByIntegrationIdAndUrl(UUID integrationId, String url);

    List<WebScrapePage> findAllByIntegrationId(UUID integrationId);

    @Query(nativeQuery = true, value = """
                SELECT COUNT(*)
                FROM gendox_core.web_scrape_pages p
                INNER JOIN gendox_core.integrations i ON i.id = p.integration_id
                WHERE i.organization_id = :organizationId
                  AND p.last_scraped_at >= :startDate
                  AND p.last_scraped_at < :endDate
            """)
    long countScrapedPagesByOrganizationIdAndPeriod(@Param("organizationId") UUID organizationId,
                                                    @Param("startDate") Instant startDate,
                                                    @Param("endDate") Instant endDate);

    List<WebScrapePage> findAllByIdInAndIntegrationId(List<UUID> ids, UUID integrationId);

    @Modifying
    @Transactional
    @Query("""
                UPDATE WebScrapePage p
                SET p.isSelected = :selected
                WHERE p.integrationId = :integrationId
                  AND p.status <> :removedStatus
            """)
    int updateSelectionForIntegration(@Param("integrationId") UUID integrationId,
                                      @Param("selected") boolean selected,
                                      @Param("removedStatus") String removedStatus);

}
