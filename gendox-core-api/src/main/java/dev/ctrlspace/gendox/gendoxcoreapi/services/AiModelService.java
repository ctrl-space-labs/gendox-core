package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModelProvider;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AuditLogs;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.AiModelCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.AiModelProviderCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.AuditLogsCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AiModelProviderRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AiModelRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AuditLogsRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.AiModelPredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.AiModelProviderPredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.AuditLogsPredicates;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import io.micrometer.tracing.Tracer;

import java.util.List;
import java.util.UUID;

@Service
public class AiModelService {

    // the organization's own before Gendox's, when both have the name
    private static final Pageable OWN_FIRST = Pageable.unpaged(Sort.by(Sort.Order.asc("organizationId").nullsLast()));

    private AiModelRepository aiModelRepository;

    private AiModelProviderRepository aiModelProviderRepository;





    @Autowired
    public AiModelService(AiModelRepository aiModelRepository,
                          AiModelProviderRepository aiModelProviderRepository) {
        this.aiModelRepository = aiModelRepository;
        this.aiModelProviderRepository = aiModelProviderRepository;


    }



    public List<AiModel> getAllActiveAiModelsByOrganizationId(UUID organizationId) {
        return aiModelRepository.findAllActiveModelsByOrganizationId(organizationId);
    }

    public Page<AiModel> getAllByCriteria(AiModelCriteria criteria, Pageable pageable) {
        return aiModelRepository.findAll(AiModelPredicates.build(criteria), pageable);
    }

    public Page<AiModelProvider> getAllProvidersByCriteria(AiModelProviderCriteria criteria, Pageable pageable) {
        return aiModelProviderRepository.findAll(AiModelProviderPredicates.build(criteria), pageable);
    }


    // one of Gendox's own models
    public AiModel getByName(String modelName) throws GendoxException {
        return getByName(modelName, null);
    }

    // a model the organization can use: one of Gendox's or one of its own
    public AiModel getByName(String modelName, UUID organizationId) throws GendoxException {
        return getAllByCriteria(AiModelCriteria.builder()
                        .name(modelName)
                        .organizationId(organizationId)
                        .includeGendoxModels(true)
                        .build(), OWN_FIRST)
                .stream()
                .findFirst()
                .orElseThrow(() -> new GendoxException("AI_MODEL_NOT_FOUND", "AI Model not found with name: " + modelName, HttpStatus.NOT_FOUND));
    }


    // a provider the organization can use: one of Gendox's or one of its own
    public AiModelProvider getProviderByName(String providerName, UUID organizationId) throws GendoxException {
        return getAllProvidersByCriteria(AiModelProviderCriteria.builder()
                        .name(providerName)
                        .organizationId(organizationId)
                        .includeGendoxProviders(true)
                        .build(), OWN_FIRST)
                .stream()
                .findFirst()
                .orElseThrow(() -> new GendoxException("AI_MODEL_PROVIDER_NOT_FOUND", "AI Model Provider not found with name: " + providerName, HttpStatus.NOT_FOUND));
    }


    // Gendox's providers and the organization's own
    public List<AiModelProvider> getAllAiModelProviders(UUID organizationId) {
        return getAllProvidersByCriteria(AiModelProviderCriteria.builder()
                .organizationId(organizationId)
                .includeGendoxProviders(true)
                .build(), Pageable.unpaged()).getContent();
    }


}
