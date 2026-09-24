package dev.ctrlspace.gendox.gendoxcoreapi.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.decision.DecisionAnswer;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.decision.DecisionRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.decision.DecisionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ChatThread;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionRuntimeOverridesDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.*;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskNodeTypeConstants;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskTypeConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.util.json.schema.JsonSchemaGenerator;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.*;

@Service
public class InsightQuestionService {
    private static final Logger logger = LoggerFactory.getLogger(InsightQuestionService.class);
    private static final double AUTO_DECISION_THRESHOLD = 0.5d;
    private static final int MAX_GENERATED_COLUMNS = 10;

    private final DecisionService decisionService;
    private final CompletionService completionService;
    private final MessageService messageService;
    private final ProjectService projectService;
    private final TaskService taskService;
    private final ObjectMapper objectMapper;

    public InsightQuestionService(DecisionService decisionService,
                                  CompletionService completionService,
                                  MessageService messageService,
                                  ProjectService projectService,
                                  TaskService taskService,
                                  ObjectMapper objectMapper) {
        this.decisionService = decisionService;
        this.completionService = completionService;
        this.messageService = messageService;
        this.projectService = projectService;
        this.taskService = taskService;
        this.objectMapper = objectMapper;
    }

    /** Expands Auto questions before the existing batch save flow. */
    public List<TaskNodeDTO> resolveAutoQuestions(List<TaskNodeDTO> requests) throws GendoxException {
        if (requests == null || requests.isEmpty()) return List.of();

        List<TaskNodeDTO> resolved = new ArrayList<>();
        for (UUID taskId : requests.stream().map(TaskNodeDTO::getTaskId).distinct().toList()) {
            Task task = taskService.getTaskById(taskId);
            List<TaskNodeDTO> taskNodes = requests.stream()
                    .filter(request -> taskId.equals(request.getTaskId()))
                    .toList();
            if (TaskTypeConstants.DOCUMENT_INSIGHTS.equalsIgnoreCase(task.getTaskType().getName())) {
                resolved.addAll(resolveTaskAutoQuestions(task, taskNodes));
            } else {
                resolved.addAll(taskNodes);
            }
        }
        return resolved;
    }

    private List<TaskNodeDTO> resolveTaskAutoQuestions(Task task, List<TaskNodeDTO> requests) throws GendoxException {
        if (requests == null || requests.isEmpty() || requests.stream().noneMatch(this::isAutoQuestion)) {
            return requests == null ? List.of() : requests;
        }

        try {
            Project project = projectService.getProjectById(task.getProjectId());
            List<TaskNodeDTO> resolved = new ArrayList<>();
            for (TaskNodeDTO request : requests) {
                if (isAutoQuestion(request)) {
                    resolved.addAll(resolveAutoQuestion(request, task, project));
                } else {
                    resolved.add(request);
                }
            }
            return resolved;
        } catch (GendoxException exception) {
            throw exception;
        } catch (Exception exception) {
            logger.error("Failed to resolve Auto insight questions for task {}", task.getId(), exception);
            throw new GendoxException("AUTO_QUESTION_RESOLUTION_FAILED",
                    "Failed to resolve Auto insight question", HttpStatus.BAD_GATEWAY);
        }
    }

    private boolean isAutoQuestion(TaskNodeDTO request) {
        return TaskNodeTypeConstants.QUESTION.equals(request.getNodeType())
                && Optional.ofNullable(request.getNodeValue())
                .map(TaskNodeValueDTO::getInsightConfig)
                .map(InsightConfigDTO::getAnswerMode)
                .filter(InsightAnswerMode.AUTO::equals)
                .isPresent();
    }

    private List<TaskNodeDTO> resolveAutoQuestion(TaskNodeDTO source, Task task, Project project) throws Exception {
        String question = source.getNodeValue().getMessage();
        if (!StringUtils.hasText(question)) {
            throw new GendoxException("QUESTION_TEXT_REQUIRED", "Auto questions need question text", HttpStatus.BAD_REQUEST);
        }

        DecisionQuestionConfigDTO classifier = DecisionQuestionConfigDTO.builder()
                .kind(DecisionKind.BOOLEAN)
                .instructions("Decide whether this request is best represented by one or more bounded Boolean, choice, or ordered rating decisions. Return true only when explicit criteria or options can be defined; requests that need a prose explanation are false.")
                .booleanCriteria(new LinkedHashMap<>(Map.of(
                        "true", "A structured decision question",
                        "false", "A generated written answer")))
                .build();
        Map<String, Object> state = new LinkedHashMap<>();
        state.put("question", question);
        if (StringUtils.hasText(task.getTaskPrompt())) {
            state.put("taskInstructions", task.getTaskPrompt());
        }

        DecisionResponse classification = decisionService.evaluate(project.getProjectAgent(),
                DecisionRequest.builder().state(state).questions(Map.of("classification", classifier)).build());
        DecisionAnswer answer = classification.getAnswers().get("classification");
        if (answer == null || answer.getNoul() == null || answer.getNoul() < AUTO_DECISION_THRESHOLD) {
            return List.of(withResolvedConfig(source, InsightConfigDTO.generatedText()));
        }

        GeneratedDecisionQuestionsDTO generated = generateDecisionDefinitions(question, task, project);
        if (generated.getQuestions() == null || generated.getQuestions().isEmpty()
                || generated.getQuestions().size() > MAX_GENERATED_COLUMNS) {
            throw new GendoxException("INVALID_GENERATED_DECISIONS",
                    "Auto must generate between one and " + MAX_GENERATED_COLUMNS + " decision columns",
                    HttpStatus.BAD_GATEWAY);
        }

        List<TaskNodeDTO> result = new ArrayList<>();
        for (GeneratedDecisionQuestionDTO generatedQuestion : generated.getQuestions()) {
            if (!StringUtils.hasText(generatedQuestion.getTitle()) || !StringUtils.hasText(generatedQuestion.getMessage())) {
                throw new GendoxException("INVALID_GENERATED_DECISION",
                        "Every generated decision needs a title and question text", HttpStatus.BAD_GATEWAY);
            }
            InsightConfigDTO config = InsightConfigDTO.builder()
                    .answerMode(InsightAnswerMode.DECISION)
                    .decision(generatedQuestion.getDecision())
                    .sourceQuestion(question)
                    .build();
            TaskNodeValueDTO value = source.getNodeValue().toBuilder()
                    .questionTitle(generatedQuestion.getTitle())
                    .message(generatedQuestion.getMessage())
                    .insightConfig(config)
                    .build();
            result.add(source.toBuilder().id(null).nodeValue(value).build());
        }
        return result;
    }

    private TaskNodeDTO withResolvedConfig(TaskNodeDTO source, InsightConfigDTO config) {
        return source.toBuilder().nodeValue(source.getNodeValue().toBuilder().insightConfig(config).build()).build();
    }

    private GeneratedDecisionQuestionsDTO generateDecisionDefinitions(String question, Task task, Project project) throws Exception {
        String prompt = """
                Convert the user's request into one or more independent decision-matrix columns.
                Each column must be atomic and use exactly one kind: BOOLEAN, CHOICE, or SCORE.
                BOOLEAN uses concise true/false criteria. CHOICE uses stable option keys mapped to human labels.
                SCORE uses 2-10 ordered labels from lowest to highest. Keep the user's meaning; do not answer it.
                Return no more than 10 columns. The message is the question shown to users and instructions are sent to the decision model.

                Example:
                User request: "Check whether the supplier is approved and classify the contract risk."
                Result:
                {
                  "questions": [
                    {"title":"Supplier approved","message":"Is the supplier approved?","decision":{"kind":"BOOLEAN","instructions":"Does the document show that the supplier is approved?","booleanCriteria":{"true":"Approved","false":"Not approved"}}},
                    {"title":"Contract risk","message":"What is the contract risk level?","decision":{"kind":"SCORE","instructions":"Rate the contract risk from low to high.","scoreCriteria":["Low","Medium","High"]}}
                  ]
                }

                Task instructions:
                %s

                User request:
                %s
                """.formatted(Optional.ofNullable(task.getTaskPrompt()).orElse(""), question);

        ChatThread thread = messageService.createThreadForMessage(
                List.of(project.getProjectAgent().getUserId()), project.getId(), "DOCUMENT_INSIGHTS - Auto question");
        Message message = new Message();
        message.setValue(prompt);
        message.setThreadId(thread.getId());
        message.setProjectId(project.getId());
        message.setCreatedBy(project.getProjectAgent().getUserId());
        message.setUpdatedBy(project.getProjectAgent().getUserId());
        message = messageService.createMessage(message);

        List<Message> completion = completionService.getCompletion(
                message, new ArrayList<>(), project, responseSchema(), taskService.buildDefaultCompletionOverrides(task));
        if (completion.isEmpty()) {
            throw new GendoxException("EMPTY_AUTO_CONFIGURATION", "The completion model returned no decision configuration", HttpStatus.BAD_GATEWAY);
        }
        return objectMapper.readValue(completion.getLast().getValue(), GeneratedDecisionQuestionsDTO.class);
    }

    private ObjectNode responseSchema() throws Exception {
        String raw = JsonSchemaGenerator.generateForType(
                new ParameterizedTypeReference<GeneratedDecisionQuestionsDTO>() { }.getType());
        JsonNode schema = objectMapper.readTree(raw);
        ObjectNode wrapper = objectMapper.createObjectNode();
        wrapper.put("name", "document_insight_decisions");
        wrapper.set("schema", schema);
        return wrapper;
    }
}
