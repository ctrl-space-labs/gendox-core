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
import org.jetbrains.annotations.Nullable;
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
        List<List<DocumentInstanceSection>> groupedDocumentPartsOrdered = groupSectionsBy100kTokens(documentGroupWithQuestions.getDocumentNode().getDocumentId());


        Task task = taskService.getTaskById(documentGroupWithQuestions.getTaskId());
        if (project == null){
            project = projectService.getProjectById(task.getProjectId());
        }

        String responseSchema = JsonSchemaGenerator.generateForType(new ParameterizedTypeReference<GroupedQuestionAnswers>() {}.getType());
        JsonNode schemaNode = objectMapper.readTree(responseSchema);
        ObjectNode responseJsonSchema = objectMapper.createObjectNode();
        responseJsonSchema.put("name", "json_response_with_actions");
        responseJsonSchema.set("schema", schemaNode);

        // For each question group
        for (List<CompletionQuestionRequest> questionGroup : groupedQuestions) {

            ChatThread newThread = messageService.createThreadForMessage(List.of(project.getProjectAgent().getUserId()), project.getId());

            String allQuestions = objectMapper.writeValueAsString(questionGroup);

            String questionsPrompt = """
                    Answer the following questions based on the provided document:
                    
                    """ + allQuestions;

            List<GroupedQuestionAnswers> allAnswersFromDocumentParts = new ArrayList<>();
            // a group of sections, is called a document part, each document might be splitted in 1, 2 or more parts (like 100K tokens per part)
            for (List<DocumentInstanceSection> groupedDocumentPart : groupedDocumentPartsOrdered) {

                Message message = buildPromptMessageForSections(groupedDocumentPart, questionsPrompt, newThread);

//                json string to object
                GroupedQuestionAnswers documentPartAnswers = getCompletion(message, responseJsonSchema, project, documentGroupWithQuestions, questionGroup);
                // error occurred, skipping...
                if (documentPartAnswers == null) continue;

                allAnswersFromDocumentParts.add(documentPartAnswers);
            }

            if (allAnswersFromDocumentParts.size() == 1) {
                logger.debug("Creating answers from a single document.");
                splitGroupAnswersToSeparateAnswerNodes(allAnswersFromDocumentParts.get(0), documentGroupWithQuestions, nodeTypeAnswer, newAnswers);
            } else if (allAnswersFromDocumentParts.size() > 1) {
                logger.debug("Creating answers from multiple document parts.");
                GroupedQuestionAnswers consolidatedDocumentAnswers = consolidatePartsAnswersToASingleOne(documentGroupWithQuestions, questionGroup, allQuestions, allAnswersFromDocumentParts, newThread, responseJsonSchema);
                // error occurred, skipping...
                if (consolidatedDocumentAnswers == null) continue;

                splitGroupAnswersToSeparateAnswerNodes(consolidatedDocumentAnswers, documentGroupWithQuestions, nodeTypeAnswer, newAnswers);
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

    private @Nullable GroupedQuestionAnswers consolidatePartsAnswersToASingleOne(TaskDocumentQuestionsDTO documentGroupWithQuestions, List<CompletionQuestionRequest> questionGroup, String allQuestions, List<GroupedQuestionAnswers> allAnswersFromDocumentParts, ChatThread newThread, ObjectNode responseJsonSchema) throws JsonProcessingException {
        String answerConsolidationPrompt = """
            Big documents dont fit in the context window of the LLM. So documents are split in 2, 3 or more parts.
            The same questions asked for all document parts, so the same question probably will have multiple answers.
            Do your best to consolidate the answers *per questionId*. *Each questionId MUST have a single answer*.
            
            This is the list of the original questions:
            %s
            
            These are the answers per document part:
            
            """.formatted(allQuestions);
        for (int i = 0; i < allAnswersFromDocumentParts.size(); i++) {
            GroupedQuestionAnswers answers = allAnswersFromDocumentParts.get(i);
            if (answers.getCompletionAnswers().isEmpty()) {
                continue;
            }

            answerConsolidationPrompt += """
                Answers for document part #%d:
                %s
                
                """.formatted(i + 1, objectMapper.writeValueAsString(answers.getCompletionAnswers()));
        }

        Message message = new Message();
        message.setValue(answerConsolidationPrompt);
        message.setThreadId(newThread.getId());
        message.setProjectId(project.getId());
        message.setCreatedBy(project.getProjectAgent().getUserId());
        message.setUpdatedBy(project.getProjectAgent().getUserId());
        message = messageService.createMessage(message);

        GroupedQuestionAnswers consolidatedDocumentAnswers = getCompletion(message, responseJsonSchema, project, documentGroupWithQuestions, questionGroup);
        return consolidatedDocumentAnswers;
    }

    private Message buildPromptMessageForSections(List<DocumentInstanceSection> sectionGroup, String questionsPrompt, ChatThread newThread) {
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
        return message;
    }

    /**
     * Splits the grouped answers into separate answer nodes for each question.
     * LLM replies many questions in a single prompt, so from all the answers the LLM replied,
     * the method finds which question each answer replies to,
     * links the answer with the question
     * and creates separate Answer nodes to be stored in the DB
     *
     * @param documentGroupWithQuestions the document group containing questions
     * @param answers                    the grouped answers to be split
     * @param nodeTypeAnswer             the type of the answer node
     * @param newAnswers                 the list to which new answer nodes will be added
     */
    private static void splitGroupAnswersToSeparateAnswerNodes(GroupedQuestionAnswers answers, TaskDocumentQuestionsDTO documentGroupWithQuestions, Type nodeTypeAnswer, List<AnswerCreationDTO> newAnswers) {
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


            newAnswers.add(answerCreationDTO);
        }
    }

    private @Nullable GroupedQuestionAnswers getCompletion(Message message, ObjectNode responseJsonSchema, Project project, TaskDocumentQuestionsDTO documentGroupWithQuestions, List<CompletionQuestionRequest> questionGroup) {
        GroupedQuestionAnswers answers;
        List<Message> response = null;
        try {
            response = completionService.getCompletion(message, new ArrayList<>(), project, responseJsonSchema);
            answers = objectMapper.readValue(response.getLast().getValue(), GroupedQuestionAnswers.class);
        } catch (GendoxException e) {
            logger.warn("Error getting completion for message: {}, error: {}", message.getId(), e.getMessage());
            logger.warn("Skipping processing documentId: {} for the questions: {}.",
                    documentGroupWithQuestions.getDocumentNode().getDocument().getId(),
                    questionGroup.stream().map(CompletionQuestionRequest::getQuestionId).toList());
            return null;

        } catch (JsonProcessingException | IllegalArgumentException e) {
            logger.warn("Error converting Json completion to GroupedQuestionAnswers, message: {}, error: {}", message.getId(), e.getMessage());
            logger.warn("Response Completion messages are: {}", response);
            logger.warn("Skipping processing documentId: {} fpr the questions: {}.",
                    documentGroupWithQuestions.getDocumentNode().getDocument().getId(),
                    questionGroup.stream().map(CompletionQuestionRequest::getQuestionId).toList());
            return null;
        }
        return answers;
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

