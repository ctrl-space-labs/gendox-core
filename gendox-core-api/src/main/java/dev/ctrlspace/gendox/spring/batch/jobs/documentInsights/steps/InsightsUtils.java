package dev.ctrlspace.gendox.spring.batch.jobs.documentInsights.steps;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.InvitationCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskNodeCriteria;
import dev.ctrlspace.gendox.spring.batch.utils.JobExecutionParamConstants;
import org.springframework.batch.core.JobParameters;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
public class InsightsUtils {

    public TaskNodeCriteria fromJobParamsToTaskNodeCriteria(JobParameters jobParameters, String taskId) {
        TaskNodeCriteria criteria = new TaskNodeCriteria();
        criteria.setTaskId(UUID.fromString(taskId));

        ObjectMapper mapper = new ObjectMapper();

        // Deserialize documentNodeIds list from JSON string
        String documentNodeIdsJson = jobParameters.getString(JobExecutionParamConstants.DOCUMENT_NODE_IDS);
        if (documentNodeIdsJson != null && !documentNodeIdsJson.isBlank()) {
            try {
                List<UUID> documentNodeIds = mapper.readValue(
                        documentNodeIdsJson,
                        new TypeReference<List<UUID>>() {
                        }
                );
                criteria.setDocumentNodeIds(documentNodeIds);
            } catch (Exception e) {
                throw new RuntimeException("Failed to deserialize documentNodeIds JSON", e);
            }
        }

        // Deserialize questionNodeIds list from JSON string
        String questionNodeIdsJson = jobParameters.getString(JobExecutionParamConstants.QUESTION_NODE_IDS);
        if (questionNodeIdsJson != null && !questionNodeIdsJson.isBlank()) {
            try {
                List<UUID> questionNodeIds = mapper.readValue(
                        questionNodeIdsJson,
                        new TypeReference<List<UUID>>() {
                        }
                );
                criteria.setQuestionNodeIds(questionNodeIds);
            } catch (Exception e) {
                throw new RuntimeException("Failed to deserialize questionNodeIds JSON", e);
            }
        }
        return criteria;
    }
}
