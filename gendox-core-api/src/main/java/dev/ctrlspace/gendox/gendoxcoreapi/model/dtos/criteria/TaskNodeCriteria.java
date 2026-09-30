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

    /** answerFilterStatuses value meaning "the document has no answer for the question". */
    public static final String UNANSWERED = "UNANSWERED";

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

    // Document Insights table: DOCUMENT nodes by document title, and by the status of their
    // answer to a question (AnswerFlag names, or UNANSWERED). answerFilterNegate keeps the rest.
    private String documentNameContains;
    private UUID answerFilterQuestionNodeId;
    private List<String> answerFilterStatuses;
    private List<String> answerFilterValues;
    private Boolean answerFilterValuePrefix;
    private Boolean answerFilterNegate;
    // The question whose answers are sorted by, with sort=answer
    private UUID sortQuestionNodeId;
}
