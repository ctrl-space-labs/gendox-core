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
    private UUID nodeValueNodeDocumentId; // the node document ID for the node_value

    // if true, the Job will re-generate answers for existing nodes. Otherwise, it will only generate answers for new nodes
    private Boolean reGenerateExistingAnswers;
    
    // Page range for document digitization (1-based indexing)
    private Integer pageFrom;
    private Integer pageTo;
}
