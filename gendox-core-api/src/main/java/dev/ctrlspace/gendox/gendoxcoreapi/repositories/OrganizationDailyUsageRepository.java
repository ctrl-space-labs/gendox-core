package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationDailyUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Date;


import java.util.UUID;

@Repository
public interface OrganizationDailyUsageRepository extends JpaRepository<OrganizationDailyUsage, UUID>, QuerydslPredicateExecutor<OrganizationDailyUsage> {

    @Query("SELECT SUM(o.messages) FROM OrganizationDailyUsage o " +
            "WHERE o.organizationId = :organizationId " +
            "AND o.date BETWEEN :startDate AND :endDate")
    Long sumMessagesByOrganizationIdAndDateBetween(@Param("organizationId") UUID organizationId,
                                                   @Param("startDate") Date startDate,
                                                   @Param("endDate") Date endDate);


    @Query("SELECT SUM(o.storageMb) FROM OrganizationDailyUsage o " +
            "WHERE o.organizationId = :organizationId " +
            "AND o.date BETWEEN :startDate AND :endDate")
    Long sumStorageMbByOrganizationIdAndDateBetween(@Param("organizationId") UUID organizationId,
                                                    @Param("startDate") Date startDate,
                                                    @Param("endDate") Date endDate);

    @Query("SELECT SUM(o.documentUploads) FROM OrganizationDailyUsage o " +
            "WHERE o.organizationId = :organizationId " +
            "AND o.date BETWEEN :startDate AND :endDate")
    Long sumDocumentUploadsByOrganizationIdAndDateBetween(@Param("organizationId") UUID organizationId,
                                                          @Param("startDate") Date startDate,
                                                          @Param("endDate") Date endDate);
}
