package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.assistant;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.DefinedToolHandler;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.ToolExecutionContext;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.AccessCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.DocumentInstanceRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.MessageRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TaskNodeRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TaskRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TypeService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskNodeTypeConstants;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * What the in-app assistant's task tools share: reading typed arguments, the access check, loading a
 * task of the agent's project, and the shapes that keep results small (pages of items, slices of text).
 */
@Component
public class AssistantToolSupport {

    public static final int DEFAULT_PAGE_SIZE = 20;
    public static final int MAX_PAGE_SIZE = 50;
    public static final int PREVIEW_CHARS = 300;
    public static final int DEFAULT_SLICE_CHARS = 6000;
    public static final int MIN_SLICE_CHARS = 500;
    public static final int MAX_SLICE_CHARS = 12000;

    private static final String UPDATE_PROJECT = "OP_UPDATE_PROJECT";

    private final ObjectMapper objectMapper;
    private final UserService userService;
    private final SecurityUtils securityUtils;
    private final MessageRepository messageRepository;
    private final TaskRepository taskRepository;
    private final TaskNodeRepository taskNodeRepository;
    private final DocumentInstanceRepository documentInstanceRepository;
    private final TypeService typeService;

    public AssistantToolSupport(ObjectMapper objectMapper,
                                UserService userService,
                                SecurityUtils securityUtils,
                                MessageRepository messageRepository,
                                TaskRepository taskRepository,
                                TaskNodeRepository taskNodeRepository,
                                DocumentInstanceRepository documentInstanceRepository,
                                TypeService typeService) {
        this.objectMapper = objectMapper;
        this.userService = userService;
        this.securityUtils = securityUtils;
        this.messageRepository = messageRepository;
        this.taskRepository = taskRepository;
        this.taskNodeRepository = taskNodeRepository;
        this.documentInstanceRepository = documentInstanceRepository;
        this.typeService = typeService;
    }

    public ObjectMapper objectMapper() {
        return objectMapper;
    }

    /** A tool's definition: its AI_TOOL_EXAMPLES row (an empty object when there is none). */
    public JsonNode toolExample(String toolName) {
        JsonNode example = typeService.getToolExampleDefinitions().get(toolName);
        return example != null ? example : objectMapper.createObjectNode();
    }

    // ------------------------------------------------------------------ arguments

    /** Tool arguments arrive as a JSON string (some adapters pass the object): read them into {@code type}. */
    public <A> A readArguments(JsonNode arguments, Class<A> type) throws GendoxException {
        return DefinedToolHandler.readArguments(objectMapper, arguments, type);
    }

    public static <T> T required(T value, String field) throws GendoxException {
        if (value == null || (value instanceof String text && text.isBlank())) {
            throw new GendoxException("MISSING_ARGUMENT", field + " is required", HttpStatus.BAD_REQUEST);
        }
        return value;
    }

    public static boolean isBlank(String text) {
        return text == null || text.isBlank();
    }

    /** 0-based page number. */
    public static int page(Integer page) {
        return page == null || page < 0 ? 0 : page;
    }

    /** Page size between 1 and {@link #MAX_PAGE_SIZE}, default {@link #DEFAULT_PAGE_SIZE}. */
    public static int size(Integer size) {
        return size == null || size < 1 ? DEFAULT_PAGE_SIZE : Math.min(size, MAX_PAGE_SIZE);
    }

    // ------------------------------------------------------------------ access

    /**
     * The tools are on agents that may be public, so they act only for a person who may update the
     * agent's project:
     * <ul>
     *   <li>in a request, the signed-in user, checked with {@link SecurityUtils#hasAuthority};</li>
     *   <li>in a background job, the user who sent the message that started it. A job an anonymous
     *       visitor started gets nothing, and neither does a task run, whose messages the agent writes
     *       itself: the agent's own user never stands in for a person.</li>
     * </ul>
     */
    public void requireProjectMember(ToolExecutionContext context) throws GendoxException {
        if (context.project() == null) {
            throw new GendoxException("TOOL_NEEDS_A_PROJECT", "This tool works inside a project", HttpStatus.BAD_REQUEST);
        }
        AccessCriteria projectCriteria = AccessCriteria.builder()
                .orgIds(new HashSet<>())
                .projectIds(Set.of(context.project().getId().toString()))
                .threadId("")
                .build();

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserProfile user = authentication != null && authentication.getPrincipal() instanceof UserProfile profile ? profile : null;
        if (user == null && RequestContextHolder.getRequestAttributes() == null) {
            UUID startedBy = startedBy(context);
            boolean byAPerson = startedBy != null
                    && (context.agent() == null || !startedBy.equals(context.agent().getUserId()));
            user = byAPerson ? userService.getUserProfileByUserId(startedBy) : null;
        }
        if (user == null) {
            throw new GendoxException("FORBIDDEN_SIGN_IN_AS_PROJECT_MEMBER",
                    "Only a signed-in member who can edit this project can use this tool. Ask the user to sign in.",
                    HttpStatus.FORBIDDEN);
        }
        if (!securityUtils.hasAuthority(user, UPDATE_PROJECT, projectCriteria)) {
            throw new GendoxException("FORBIDDEN_NO_EDIT_ACCESS",
                    "The user is signed in but cannot edit this project. They need edit access from a project admin.",
                    HttpStatus.FORBIDDEN);
        }
    }

    /** The author of the latest stored user message of the conversation: who started a background job. */
    private UUID startedBy(ToolExecutionContext context) {
        List<AiModelMessage> messages = context.parentPreviousMessages() == null ? List.of() : context.parentPreviousMessages();
        for (int i = messages.size() - 1; i >= 0; i--) {
            AiModelMessage message = messages.get(i);
            if ("user".equals(message.getRole()) && message.getId() != null) {
                return messageRepository.findById(message.getId()).map(Message::getCreatedBy).orElse(null);
            }
        }
        return null;
    }

    /** A task of the agent's project; a task of any other project reads as not found. */
    public Task loadTask(ToolExecutionContext context, UUID taskId) throws GendoxException {
        Task task = taskRepository.findById(required(taskId, "task_id")).orElse(null);
        if (task == null || !context.project().getId().equals(task.getProjectId())) {
            throw new GendoxException("TASK_NOT_FOUND", "No task " + taskId + " in this project", HttpStatus.NOT_FOUND);
        }
        return task;
    }

    /** Documents must belong to the agent's project. */
    public void requireDocumentsInProject(ToolExecutionContext context, Collection<UUID> documentIds) throws GendoxException {
        if (!documentIds.isEmpty() && !securityUtils.areAllDocumentsInAnyProject(documentIds, List.of(context.project().getId()))) {
            throw new GendoxException("DOCUMENT_NOT_IN_PROJECT", "One or more documents do not belong to this project", HttpStatus.FORBIDDEN);
        }
    }

    // ------------------------------------------------------------------ task nodes

    /** The DOCUMENT nodes of a task, keyed by document id. */
    public Map<UUID, TaskNode> documentNodes(UUID taskId, Collection<UUID> documentIds) {
        if (documentIds.isEmpty()) {
            return Map.of();
        }
        return taskNodeRepository.findAllByTaskIdAndDocumentIdInAndNodeTypeName(taskId, documentIds, TaskNodeTypeConstants.DOCUMENT)
                .stream()
                .collect(Collectors.toMap(TaskNode::getDocumentId, Function.identity(), (a, b) -> a));
    }

    public TaskNode requireDocumentNode(Task task, UUID documentId) throws GendoxException {
        TaskNode node = documentNodes(task.getId(), List.of(documentId)).get(documentId);
        if (node == null) {
            throw new GendoxException("TASK_DOCUMENT_NOT_FOUND",
                    "Document " + documentId + " is not in this task. List the task's documents with list_task_items.",
                    HttpStatus.NOT_FOUND);
        }
        return node;
    }

    public TaskNode requireQuestionNode(Task task, UUID questionId) throws GendoxException {
        TaskNode node = taskNodeRepository.findById(questionId).orElse(null);
        if (node == null || !task.getId().equals(node.getTaskId())
                || node.getNodeType() == null || !TaskNodeTypeConstants.QUESTION.equals(node.getNodeType().getName())) {
            throw new GendoxException("TASK_QUESTION_NOT_FOUND",
                    "Question " + questionId + " is not in this task. List the task's questions with list_task_items.",
                    HttpStatus.NOT_FOUND);
        }
        return node;
    }

    /** Document titles by id, in one query. */
    public Map<UUID, String> documentTitles(Collection<UUID> documentIds) {
        Set<UUID> ids = documentIds.stream().filter(Objects::nonNull).collect(Collectors.toSet());
        Map<UUID, String> titles = new HashMap<>();
        if (!ids.isEmpty()) {
            for (DocumentInstance document : documentInstanceRepository.findAllById(ids)) {
                titles.put(document.getId(), document.getTitle());
            }
        }
        return titles;
    }

    /** Maps DOCUMENT node ids to their document ids, in one query. */
    public Map<UUID, UUID> documentIdsByNodeId(Collection<UUID> documentNodeIds) {
        Set<UUID> ids = documentNodeIds.stream().filter(Objects::nonNull).collect(Collectors.toSet());
        Map<UUID, UUID> byNode = new HashMap<>();
        if (!ids.isEmpty()) {
            for (TaskNode node : taskNodeRepository.findAllById(ids)) {
                byNode.put(node.getId(), node.getDocumentId());
            }
        }
        return byNode;
    }

    // ------------------------------------------------------------------ result shapes

    public ObjectNode pageResult(List<? extends JsonNode> items, int page, int size, long total) {
        ObjectNode result = objectMapper.createObjectNode();
        ArrayNode array = result.putArray("items");
        items.forEach(array::add);
        result.put("page", page);
        result.put("size", size);
        result.put("total", total);
        result.put("has_more", (long) (page + 1) * size < total);
        return result;
    }

    public ObjectNode pageResult(List<? extends JsonNode> items, Page<?> page) {
        return pageResult(items, page.getNumber(), page.getSize(), page.getTotalElements());
    }

    /** One slice of a long text. {@code next_offset} is null on the last slice. Never cuts a surrogate pair in half. */
    public ObjectNode slice(String text, Integer requestedOffset, Integer requestedMaxChars) {
        String value = text == null ? "" : text;
        int total = value.length();
        int offset = requestedOffset == null ? 0 : Math.max(0, Math.min(requestedOffset, total));
        int maxChars = requestedMaxChars == null ? DEFAULT_SLICE_CHARS
                : Math.max(MIN_SLICE_CHARS, Math.min(requestedMaxChars, MAX_SLICE_CHARS));

        int end = Math.min(total, offset + maxChars);
        if (end < total && end > offset && Character.isHighSurrogate(value.charAt(end - 1))) {
            end--;
        }

        ObjectNode result = objectMapper.createObjectNode();
        result.put("text", value.substring(offset, end));
        result.put("offset", offset);
        result.put("total_chars", total);
        if (end < total) {
            result.put("next_offset", end);
        } else {
            result.putNull("next_offset");
        }
        return result;
    }

    public static String preview(String text) {
        if (text == null) {
            return null;
        }
        String flat = text.replaceAll("\\s+", " ").trim();
        if (flat.length() <= PREVIEW_CHARS) {
            return flat;
        }
        int end = PREVIEW_CHARS;
        if (Character.isHighSurrogate(flat.charAt(end - 1))) {
            end--;
        }
        return flat.substring(0, end) + "…";
    }

    public static int length(String text) {
        return text == null ? 0 : text.length();
    }
}
