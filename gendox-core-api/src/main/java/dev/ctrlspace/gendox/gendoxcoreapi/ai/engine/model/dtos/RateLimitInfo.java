package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class RateLimitInfo {

    private Long totalRateLimitRequests;
    private Long totalRateLimitTokens;
    private Long rateLimitRemainingRequests;
    private Long rateLimitRemainingTokens;
    private Long rateLimitResetRequestsMilliseconds;
    private Long rateLimitResetTokensMilliseconds;
}
