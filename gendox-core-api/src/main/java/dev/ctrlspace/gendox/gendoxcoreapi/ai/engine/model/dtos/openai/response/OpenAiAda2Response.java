package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response;

import com.sun.xml.xsom.impl.ListSimpleTypeImpl;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class OpenAiAda2Response {

    private List<EmbeddingData> data;
    private String model;
    private String object;
    private Usage usage;

    private Long totalRateLimitRequests;
    private Long totalRateLimitTokens;
    private Long rateLimitRemainingRequests;
    private Long rateLimitRemainingTokens;
    private Long rateLimitResetRequestsMilliseconds;
    private Long rateLimitResetTokensMilliseconds;

}






