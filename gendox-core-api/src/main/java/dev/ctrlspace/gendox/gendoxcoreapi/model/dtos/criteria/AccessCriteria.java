package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class AccessCriteria {
    private Set<String> orgIds;
    private Set<String> projectIds;
    private String threadId;
    private List<String> documentIds;
}