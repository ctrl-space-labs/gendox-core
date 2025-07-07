package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.tools;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class AdvancedSearchArguments {
    @JsonProperty("search_query")
    private String searchQuery;
}
