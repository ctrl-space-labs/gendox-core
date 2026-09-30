package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.decision.DecisionRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.decision.DecisionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;

public interface DecisionModelApiAdapter {
    DecisionResponse evaluate(DecisionRequest request, AiModel model, String apiKey) throws GendoxException;
    boolean supports(String apiTypeName);
}
