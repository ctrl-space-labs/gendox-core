package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.RerankResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.voyage.response.VoyageRerankResponse;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class VoyageRerankResponseConverter {

    public  RerankResponse toRerankResponse(VoyageRerankResponse voyageResponse) {
        List<RerankResponse.Result> results = voyageResponse.getData().stream()
                .map(vr -> RerankResponse.Result.builder()
                        .index(vr.getIndex())
                        .relevance_score(vr.getRelevance_score())
                        .build())
                .collect(Collectors.toList());

        return RerankResponse.builder()
                .id(UUID.randomUUID().toString()) // Voyage does not return ID, so generate one
                .results(results)
                .total_tokens(
                        voyageResponse.getUsage() != null ? voyageResponse.getUsage().getTotal_tokens() : null)
                .build();
    }
}

