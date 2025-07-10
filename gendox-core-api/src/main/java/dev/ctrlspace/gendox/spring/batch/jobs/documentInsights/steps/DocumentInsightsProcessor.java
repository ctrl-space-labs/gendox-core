package dev.ctrlspace.gendox.spring.batch.jobs.documentInsights.steps;


import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.knuddels.jtokkit.api.Encoding;
import com.knuddels.jtokkit.api.EncodingRegistry;
import com.knuddels.jtokkit.api.ModelType;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.*;
import dev.ctrlspace.gendox.gendoxcoreapi.services.*;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskNodeTypeConstants;
import org.jetbrains.annotations.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.util.json.schema.JsonSchemaGenerator;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;


import java.util.*;


@Component
@StepScope
public class DocumentInsightsProcessor implements ItemProcessor<TaskDocumentQuestionsDTO, TaskAnswerBatchDTO> {

    private static final Logger logger = LoggerFactory.getLogger(DocumentInsightsProcessor.class);

    @Value("#{jobParameters['reGenerateExistingAnswers'] == 'true'}")
    private Boolean reGenerateExistingAnswers;


    private final CompletionService completionService;
    private final ProjectService projectService;
    private final MessageService messageService;
    private final DocumentSectionService documentSectionService;

    private TypeService typeService;
    private TaskService taskService;
    private ObjectMapper objectMapper;
    private EncodingRegistry encodingRegistry;
    private Project project;

    @Autowired
    public DocumentInsightsProcessor(TypeService typeService,
                                     TaskService taskService,
                                     ObjectMapper objectMapper,
                                     EncodingRegistry encodingRegistry,
                                     CompletionService completionService,
                                     ProjectService projectService,
                                     MessageService messageService,
                                     DocumentSectionService documentSectionService) {
        this.typeService = typeService;
        this.taskService = taskService;
        this.objectMapper = objectMapper;
        this.encodingRegistry = encodingRegistry;
        this.completionService = completionService;
        this.projectService = projectService;
        this.messageService = messageService;
        this.documentSectionService = documentSectionService;
    }

    @Override
    public TaskAnswerBatchDTO process(TaskDocumentQuestionsDTO documentGroupWithQuestions) throws Exception {

        List<AnswerCreationDTO> newAnswers = new ArrayList<>();
        List<TaskNode> existingAnswers = new ArrayList<>();
        List<TaskNode> answeredQuestions = new ArrayList<>();
        TaskAnswerBatchDTO taskAnswerBatchDTO = new TaskAnswerBatchDTO();

        populateExistingAnswers(documentGroupWithQuestions, existingAnswers, answeredQuestions);
        if (reGenerateExistingAnswers) {
            // Delete the old once and create new
            taskAnswerBatchDTO.setAnswersToDelete(existingAnswers);
        } else {
            // remove the questions, that already have been answered
            documentGroupWithQuestions.getQuestionNodes().removeAll(answeredQuestions);
            if (documentGroupWithQuestions.getQuestionNodes().isEmpty()) {
                return null;
            }
        }


        Type nodeTypeAnswer = typeService.getTaskNodeTypeByName(TaskNodeTypeConstants.ANSWER);

        List<List<CompletionQuestionRequest>> groupedQuestions = groupQuestionsBy10(documentGroupWithQuestions);
        List<List<DocumentInstanceSection>> groupedOrderedSections = groupSectionsBy100kTokens(documentGroupWithQuestions.getDocumentNode().getDocument().getId());


        Task task = taskService.getTaskById(documentGroupWithQuestions.getTaskId());
        if (project == null){
            project = projectService.getProjectById(task.getProjectId());
        }

        ChatThread newThread = messageService.createThreadForMessage(List.of(project.getProjectAgent().getUserId()), project.getId());


        String responseSchema = JsonSchemaGenerator.generateForType(new ParameterizedTypeReference<GroupedQuestionAnswers>() {}.getType());
        JsonNode schemaNode = objectMapper.readTree(responseSchema);
        ObjectNode responseJsonSchema = objectMapper.createObjectNode();
        responseJsonSchema.put("name", "json_response_with_actions");
        responseJsonSchema.set("schema", schemaNode);

        // For each question group
        for (List<CompletionQuestionRequest> questionGroup : groupedQuestions) {
            String allQuestions = objectMapper.writeValueAsString(questionGroup);

            String questionsPrompt = """
                    Answer the following questions based on the provided document:
                    
                    """ + allQuestions;

            // For each section group
            for (List<DocumentInstanceSection> sectionGroup : groupedOrderedSections) {

                String textSections = sectionGroup.stream()
                        .map(DocumentInstanceSection::getSectionValue)
                        .reduce("", (a, b) -> a + "\n\n" + b);

                String prompt = """
                    You are an AI assistant that answers questions based on provided text.
                    The text is as follows:
                    
                    %s
                    
                    Please answer the following question:
                    
                    %s
                    """.formatted(textSections, questionsPrompt);

                Message message = new Message();
                message.setValue(prompt);
                message.setThreadId(newThread.getId());
                message.setProjectId(project.getId());
                message.setCreatedBy(project.getProjectAgent().getUserId());
                message.setUpdatedBy(project.getProjectAgent().getUserId());
                message = messageService.createMessage(message);


//                json string to object
                List<Message> response = null;
                GroupedQuestionAnswers answers = null;
                try {
                    response = completionService.getCompletion(message, new ArrayList<>(), project, responseJsonSchema);
                    answers = objectMapper.readValue(response.getLast().getValue(), GroupedQuestionAnswers.class);
                } catch (GendoxException e) {
                    logger.warn("Error getting completion for message: {}, error: {}", message.getId(), e.getMessage());
                    logger.warn("Skipping processing documentId: {} for the questions: {}.",
                            documentGroupWithQuestions.getDocumentNode().getDocument().getId(),
                            questionGroup.stream().map(CompletionQuestionRequest::getQuestionId).toList());
                    continue;

                } catch (JsonProcessingException | IllegalArgumentException e) {
                    logger.warn("Error converting Json completion to GroupedQuestionAnswers, message: {}, error: {}", message.getId(), e.getMessage());
                    logger.warn("Response Completion messages are: {}", response);
                    logger.warn("Skipping processing documentId: {} fpr the questions: {}.",
                            documentGroupWithQuestions.getDocumentNode().getDocument().getId(),
                            questionGroup.stream().map(CompletionQuestionRequest::getQuestionId).toList());
                    continue;
                }

                for (CompletionQuestionResponse answer : answers.getCompletionAnswers()) {

                    TaskNode question = documentGroupWithQuestions.getQuestionNodes().stream()
                            .filter(q -> q.getId().equals(answer.getQuestionId()))
                            .findFirst()
                            .orElse(null);

                    if (question == null) {
                        continue;
                    }

                    // Create TaskNodeValueDTO with the answer message
                    TaskNodeValueDTO valueDTO = TaskNodeValueDTO.builder()
                            .message(answer.getAnswerText())
                            .answerValue(answer.getAnswerValue())
                            .answerFlagEnum(answer.getAnswerFlagEnum())
                            .nodeQuestionId(question.getId())
                            .nodeDocumentId(documentGroupWithQuestions.getDocumentNode().getId())
                            .build();

                    // Build TaskNodeDTO for the ANSWER node
                    TaskNodeDTO answerNodeDTO = TaskNodeDTO.builder()
                            .taskId(documentGroupWithQuestions.getTaskId())
                            .nodeType(nodeTypeAnswer.getName())
                            .nodeValue(valueDTO)
                            .build();

                    // Create AnswerCreationDTO
                    AnswerCreationDTO answerCreationDTO = AnswerCreationDTO.builder()
                            .documentNode(documentGroupWithQuestions.getDocumentNode())
                            .questionNode(question)
                            .newAnswer(answerNodeDTO)
                            .build();

                    // TODO a single answer need to be generated for the questions of each document
                    newAnswers.add(answerCreationDTO);
                }


            }

            logger.info("Processed TaskDocumentInsightsAnswerDTO: taskId={}, documentNodeId={}, questions # = {}",
                    documentGroupWithQuestions.getTaskId(),
                    documentGroupWithQuestions.getDocumentNode().getId(),
                    documentGroupWithQuestions.getQuestionNodes().size()
            );

        }

        taskAnswerBatchDTO.setNewAnswers(newAnswers);
        return taskAnswerBatchDTO;
    }

    /**
     * Scans all question nodes in the given document group and collects any existing
     * answer nodes along with their corresponding questions.
     *
     * @param documentGroupWithQuestions the DTO containing the document and its questions
     * @param existingAnswers           a list to be populated with found answer nodes
     * @param answeredQuestions         a list to be populated with questions that already have answers
     */
    private void populateExistingAnswers(TaskDocumentQuestionsDTO documentGroupWithQuestions, List<TaskNode> existingAnswers, List<TaskNode> answeredQuestions) {
        for (TaskNode question : documentGroupWithQuestions.getQuestionNodes()) {
            //TODO this can be done in one query, instead of a for loop
            taskService.findAnswerNodeByDocumentAndQuestionOptional(
                    documentGroupWithQuestions.getDocumentNode().getTaskId(),
                    documentGroupWithQuestions.getDocumentNode().getId(),
                    question.getId())
                    .ifPresent(anser -> {
                        existingAnswers.add(anser);
                        answeredQuestions.add(question);
                    });
        }
    }

    private @NotNull List<List<CompletionQuestionRequest>> groupQuestionsBy10(TaskDocumentQuestionsDTO documentGroupWithQuestions) {
        // Process the questions 10-by-10
        List<List<CompletionQuestionRequest>> groupedQuestions = new ArrayList<>();
        int pageSize = 10;

        for (int i = 0; i < documentGroupWithQuestions.getQuestionNodes().size(); i += pageSize) {
            int end = Math.min(i + pageSize, documentGroupWithQuestions.getQuestionNodes().size());

            // 1) take a subList of TaskNode
            List<TaskNode> slice = documentGroupWithQuestions.getQuestionNodes().subList(i, end);

            // 2) map each TaskNode → CompletionQuestionRequest
            List<CompletionQuestionRequest> reqs = new ArrayList<>(slice.size());
            for (TaskNode node : slice) {
                CompletionQuestionRequest req = CompletionQuestionRequest.builder()
                        .questionId(node.getId())
                        .questionText(node.getNodeValue().getMessage())
                        .build();
                reqs.add(req);
            }

            groupedQuestions.add(reqs);
        }
        return groupedQuestions;
    }

    private @NotNull
    List<List<DocumentInstanceSection>> groupSectionsBy100kTokens(UUID documentId) {
        Encoding enc = encodingRegistry.getEncodingForModel(ModelType.GPT_4O);
        final int MAX_TOKENS = 100_000;

        List<List<DocumentInstanceSection>> groups = new ArrayList<>();
        List<DocumentInstanceSection> currentGroup = new ArrayList<>();
        int currentTokens = 0;

        // 1) Extract & sort
        List<DocumentInstanceSection> sections = documentSectionService.getSectionsByDocument(documentId);
        sections.sort(Comparator.comparingInt(
                s -> s.getDocumentSectionMetadata().getSectionOrder()
        ));

        for (DocumentInstanceSection section : sections) {
            String text = section.getSectionValue();
            int tokens = enc.encode(text).size();

            // if adding this section would overflow the 100k-token budget, flush
            if (currentTokens + tokens > MAX_TOKENS) {
                if (!currentGroup.isEmpty()) {
                    groups.add(currentGroup);
                    currentGroup = new ArrayList<>();
                    currentTokens = 0;
                }
            }

            // (optional) if a single section is >100k on its own, you’ll need to chunk it
            // here—e.g. split on sentences or paragraphs, or just allow an “oversized” group.

            currentGroup.add(section);
            currentTokens += tokens;
        }

        // add the last group if non-empty
        if (!currentGroup.isEmpty()) {
            groups.add(currentGroup);
        }

        return groups;
    }


}

