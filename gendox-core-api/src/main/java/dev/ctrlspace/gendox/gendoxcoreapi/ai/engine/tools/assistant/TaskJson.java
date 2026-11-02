package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.assistant;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.ToolExecutionContext;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskNodeValueDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskTypeConstants;

/** How tasks and task nodes look in tool results. */
final class TaskJson {

    private TaskJson() {
    }

    static ObjectNode summary(ObjectMapper objectMapper, Task task, ToolExecutionContext context) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("task_id", task.getId().toString());
        node.put("title", task.getTitle());
        node.put("type", task.getTaskType().getName());
        node.put("description", AssistantToolSupport.preview(task.getDescription()));
        node.put("created_at", task.getCreatedAt() != null ? task.getCreatedAt().toString() : null);
        node.put("url_path", urlPath(task, context));
        return node;
    }

    /** The page of the task in the Gendox app, to link to. Null for task types without a page. */
    static String urlPath(Task task, ToolExecutionContext context) {
        String page = switch (task.getTaskType().getName()) {
            case TaskTypeConstants.DOCUMENT_INSIGHTS -> "/gendox/tasks/document-insights/";
            case TaskTypeConstants.DOCUMENT_DIGITIZATION -> "/gendox/tasks/document-digitization/";
            case TaskTypeConstants.EARTH_OBSERVATION -> "/gendox/tasks/earth-observation/workspace/";
            default -> null;
        };
        if (page == null) {
            return null;
        }
        return page + "?organizationId=" + context.project().getOrganizationId()
                + "&projectId=" + context.project().getId()
                + "&taskId=" + task.getId();
    }

    static Integer order(TaskNode node) {
        return node.getNodeValue() != null ? node.getNodeValue().getOrder() : null;
    }

    static ObjectNode question(ObjectMapper objectMapper, TaskNode node) {
        TaskNodeValueDTO value = node.getNodeValue() != null ? node.getNodeValue() : new TaskNodeValueDTO();
        ObjectNode item = objectMapper.createObjectNode();
        item.put("question_id", node.getId().toString());
        item.put("order", value.getOrder());
        item.put("title", value.getQuestionTitle());
        item.put("text", value.getMessage());
        if (value.getInsightConfig() != null && value.getInsightConfig().getAnswerMode() != null) {
            item.put("answer_mode", value.getInsightConfig().getAnswerMode().name());
        }
        return item;
    }
}
