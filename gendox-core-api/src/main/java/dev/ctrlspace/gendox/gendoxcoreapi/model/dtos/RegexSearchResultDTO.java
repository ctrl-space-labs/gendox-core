package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Result of {@code regex_search} tool: matches plus optional invalid pattern strings.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record RegexSearchResultDTO(
        @JsonProperty("total_matches") int totalMatches,
        List<RegexSearchMatchDTO> matches,
        @JsonProperty("invalid_patterns") List<String> invalidPatterns
) {}
