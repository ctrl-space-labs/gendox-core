package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.impl;

import com.fasterxml.jackson.databind.node.ObjectNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Choice;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.EmbeddingData;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Usage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelApiAdapterService;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiTools;
import org.jetbrains.annotations.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
public class MockGeminiServiceAdapter implements AiModelApiAdapterService {

    Logger logger = LoggerFactory.getLogger(MockGeminiServiceAdapter.class);

    protected Set<String> supportedApiType = Set.of("MOCK_GEMINI_API");

    @Override
    public EmbeddingResponse askEmbedding(EmbeddingMessage embeddingMessage, AiModel aiModel, String apiKey) {
        logger.info("MOCK GEMINI: Instant embedding for testing - model: {}", aiModel.getModel());

        // Return a mock embedding vector (1536 dimensions like text-embedding-ada-002)
        List<Double> mockEmbedding = generateMockEmbedding(1536);

        return EmbeddingResponse.builder()
                .model(aiModel.getModel())
                .object("list")
                .usage(Usage.builder()
                        .promptTokens(0)  // Free
                        .totalTokens(0)   // Free
                        .build())
                .data(List.of(
                        EmbeddingData.builder()
                                .embedding(mockEmbedding)
                                .index(0)
                                .object("embedding")
                                .build()))
                .build();
    }

    @Override
    public CompletionResponse askCompletion(List<AiModelMessage> messages, String agentRole, AiModel aiModel,
                                            AiModelRequestParams aiModelRequestParams, String apiKey,
                                            List<AiTools> tools, String toolChoice,
                                            @Nullable ObjectNode responseJsonSchema) {
        logger.info("MOCK GEMINI: Instant completion for testing - model: {}", aiModel.getModel());
        logger.debug("Messages count: {}, Agent role: {}, Tools: {}",
                messages.size(), agentRole, tools.size());

        String mockContent = generateMockGeminiResponse(messages, agentRole);

        return CompletionResponse.builder()
                .model(aiModel.getModel())
                .topP(aiModelRequestParams.getTopP())
                .temperature(aiModelRequestParams.getTemperature())
                .maxToken(aiModelRequestParams.getMaxTokens())
                .usage(Usage.builder()
                        .completionTokens(150)
                        .promptTokens(messages.size() * 10)
                        .totalTokens(150 + messages.size() * 10)
                        .build())
                .choices(List.of(Choice.builder()
                        .index(0)
                        .finishReason("stop")
                        .message(AiModelMessage.builder()
                                .role("assistant")
                                .content(mockContent)
                                .build())
                        .build()))
                .build();
    }

    @Override
    public ModerationResponse askModeration(String message, String apiKey, AiModel aiModel) {
        logger.info("MOCK GEMINI: Moderation check");
        return null;
    }

    @Override
    public RerankResponse askRerank(List<String> documents, String query, AiModel aiModel, String apiKey) {
        logger.info("MOCK GEMINI: Reranking not supported");
        return null;
    }

    @Override
    public Set<String> getSupportedApiTypeNames() {
        return supportedApiType;
    }

    @Override
    public boolean supports(String apiTypeName) {
        return getSupportedApiTypeNames().contains(apiTypeName);
    }

    // Helper methods
    private List<Double> generateMockEmbedding(int dimensions) {
        List<Double> embedding = new java.util.ArrayList<>();
        for (int i = 0; i < dimensions; i++) {
            embedding.add(Math.random() * 0.1 - 0.05);  // Random values between -0.05 and 0.05
        }
        return embedding;
    }

    private String generateMockGeminiResponse(List<AiModelMessage> messages, String agentRole) {
        String lastUserMessage = messages.stream()
                .filter(m -> "user".equals(m.getRole()))
                .reduce((first, second) -> second)
                .map(AiModelMessage::getContent)
                .orElse("query");

        return String.format(
                "**MOCK GEMINI RESPONSE FOR PERFORMANCE TESTING**\n\n" +
                        "Your question: \"%s\"\n\n" +
                        "This is an instant mock response simulating Gemini 2.0 Flash behavior. " +
                        "In production, this would be processed by the actual Google Gemini API. " +
                        "The response is generated instantly to test the performance of other system components " +
                        "like document retrieval, embedding search, reranking, and frontend rendering.\n\n" +
                        "**Benefits of Mock Testing:**\n" +
                        "- Zero API costs\n" +
                        "- Instant responses (no network latency)\n" +
                        "- Consistent output for benchmarking\n" +
                        "- Test system under load without rate limits\n\n" +
                        "**Agent Role:** %s",
                lastUserMessage.substring(0, Math.min(100, lastUserMessage.length())),
                agentRole != null ? agentRole : "Not specified"
        );
    }
}
