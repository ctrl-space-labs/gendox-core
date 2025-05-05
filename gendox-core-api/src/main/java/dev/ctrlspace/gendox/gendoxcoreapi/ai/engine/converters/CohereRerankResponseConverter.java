package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.response.CohereRerankResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.RerankResponse;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class CohereRerankResponseConverter {

    public RerankResponse toRerankResponse(CohereRerankResponse cohereResponse) {
        List<RerankResponse.Result> results = cohereResponse.getResults().stream()
                .map(result -> RerankResponse.Result.builder()
                        .index(result.getIndex())
                        .relevance_score(result.getRelevance_score())
                        .build())
                .collect(Collectors.toList());

        return RerankResponse.builder()
                .id(cohereResponse.getId())
                .results(results)
                .total_tokens(cohereResponse.getMeta() != null &&
                        cohereResponse.getMeta().getBilled_units() != null
                        ? cohereResponse.getMeta().getBilled_units().getSearch_units()
                        : null)
                .build();
    }

}
