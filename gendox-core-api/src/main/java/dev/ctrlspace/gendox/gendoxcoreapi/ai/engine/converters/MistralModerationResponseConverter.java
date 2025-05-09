package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.ModerationResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.mistral.response.MistralModerationResponse;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class MistralModerationResponseConverter {
    public ModerationResponse toModerationResponse(MistralModerationResponse mistralResponse) {
        List<ModerationResponse.Result> convertedResults = mistralResponse.getResults().stream()
                .map(mistralResult -> {
                    Map<String, Boolean> categories = mistralResult.getCategories();
                    Map<String, Double> categoryScores = mistralResult.getCategory_scores();
                    boolean flagged = categories.values().stream().anyMatch(Boolean::booleanValue);

                    return ModerationResponse.Result.builder()
                            .flagged(flagged)
                            .categories(categories)
                            .category_scores(categoryScores)
                            .build();
                })
                .collect(Collectors.toList());

        return ModerationResponse.builder()
                .id(mistralResponse.getId())
                .model(mistralResponse.getModel())
                .results(convertedResults)
                .build();
    }
}
