package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DailyUsageAggregationResultDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.OrganizationDailyUsageRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class BackendMaintenanceTaskService {


    private OrganizationDailyUsageRepository organizationDailyUsageRepository;
    @Value("${gendox.maintenance.daily-usage-aggregator.batch-size:50000}")
    private Integer batchSize;

    public BackendMaintenanceTaskService(OrganizationDailyUsageRepository organizationDailyUsageRepository) {
        this.organizationDailyUsageRepository = organizationDailyUsageRepository;
    }


    public DailyUsageAggregationResultDTO aggregateDailyUsage() {
        return organizationDailyUsageRepository.aggregateDailyUsage(batchSize);
    }


}
