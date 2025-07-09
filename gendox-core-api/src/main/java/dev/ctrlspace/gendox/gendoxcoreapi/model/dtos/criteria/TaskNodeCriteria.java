package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class TaskNodeCriteria {

    private UUID taskId;
    private List<UUID> nodeIds;
    private List<String> nodeTypeNames;
    private List<UUID> documentNodeIds;  // for DOCUMENT type nodes
    private List<UUID> questionNodeIds;  // for QUESTION type nodes
    private List<UUID> answerNodeIds;    // for ANSWER type nodes
}
