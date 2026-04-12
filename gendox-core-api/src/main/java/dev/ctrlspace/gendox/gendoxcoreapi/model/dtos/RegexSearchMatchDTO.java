package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * One line in a document that matched a regex pattern ({@link RegexSearchResultDTO}),
 * with optional adjacent lines for context.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record RegexSearchMatchDTO(
        @JsonProperty("document_id") String documentId,
        @JsonProperty("line_number") int lineNumber,
        String pattern,
        @JsonProperty("line_text") String lineText
) {}
