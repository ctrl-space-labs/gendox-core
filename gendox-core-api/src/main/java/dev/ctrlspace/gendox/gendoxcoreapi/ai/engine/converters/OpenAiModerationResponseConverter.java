package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.ModerationResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.OpenAiModerationResponse;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class OpenAiModerationResponseConverter {
    public ModerationResponse toModerationResponse(OpenAiModerationResponse openAiModerationResponse) {
        List<ModerationResponse.Result> convertedResults = openAiModerationResponse.getResults().stream()
                .map(openResult -> ModerationResponse.Result.builder()
                        .flagged(openResult.isFlagged())
                        .categories(openResult.getCategories())
                        .category_scores(openResult.getCategory_scores())
                        .build())
                .collect(Collectors.toList());

        return ModerationResponse.builder()
                .id(openAiModerationResponse.getId())
                .model(openAiModerationResponse.getModel())
                .results(convertedResults)
                .build();
    }
}
