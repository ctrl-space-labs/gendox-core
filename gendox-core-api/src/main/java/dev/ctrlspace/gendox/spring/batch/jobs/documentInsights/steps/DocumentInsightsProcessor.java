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
import org.springframework.stereotype.Component;


import java.util.*;


@Component
@StepScope
public class DocumentInsightsProcessor implements ItemProcessor<TaskDocumentQuestionsDTO, TaskAnswerBatchDTO> {

    private static final Logger logger = LoggerFactory.getLogger(DocumentInsightsProcessor.class);

    @Value("#{jobParameters['reGenerateExistingAnswers'] == 'true'}")
    private Boolean reGenerateExistingAnswers;
    private static final int CHUNK_SIZE = 10;
    private static final int MAX_TOKENS = 100_000;


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

        TaskAnswerBatchDTO batch = new TaskAnswerBatchDTO();

        /* 1 – Filter questions that are already answered (optionally delete old) */
        List<AnswerCreationDTO> newAnswers = new ArrayList<>();
        List<TaskNode> answeredQuestions = new ArrayList<>();
        List<TaskNode> answersToDelete = new ArrayList<>();

        documentGroupWithQuestions.getQuestionNodes().forEach(q ->
                taskService.findAnswerNodeByDocumentAndQuestionOptional(
                                documentGroupWithQuestions.getDocumentNode().getTaskId(),
                                documentGroupWithQuestions.getDocumentNode().getId(),
                                q.getId())
                        .ifPresent(a -> {
                            answeredQuestions.add(q);
                            answersToDelete.add(a);
                        }));

        if (reGenerateExistingAnswers) {
            batch.setAnswersToDelete(answersToDelete);
        } else {
            documentGroupWithQuestions.getQuestionNodes().removeAll(answeredQuestions);
            if (documentGroupWithQuestions.getQuestionNodes().isEmpty()) {
                return null; // nothing left to process
            }
        }


        Type answerNodeType = typeService.getTaskNodeTypeByName(TaskNodeTypeConstants.ANSWER);
        Task task = taskService.getTaskById(documentGroupWithQuestions.getTaskId());
        if (project == null){
            project = projectService.getProjectById(task.getProjectId());
        }
        ObjectNode responseJsonSchema = buildResponseSchema();

        List<List<CompletionQuestionRequest>> questionChunks = chunkQuestionsToGroups(documentGroupWithQuestions.getQuestionNodes());
        List<List<DocumentInstanceSection>> sectionChunks = groupSectionsBy100kTokens(documentGroupWithQuestions.getDocumentNode().getDocument().getId());

        // For each question group
        for (List<CompletionQuestionRequest> questionChunk : questionChunks) {

            ChatThread newThread = messageService.createThreadForMessage(List.of(project.getProjectAgent().getUserId()), project.getId());

            String allQuestions = objectMapper.writeValueAsString(questionChunk);
            String questionsPrompt = """
                    Answer the following questions based on the provided document:
                    
                    """ + allQuestions;

            List<GroupedQuestionAnswers> partialAnswers = new ArrayList<>();
            // a group of sections, is called a document part, each document might be splitted in 1, 2 or more parts (like 100K tokens per part)
            for (List<DocumentInstanceSection> groupedDocumentPart : sectionChunks) {
                Message message = buildPromptMessageForSections(groupedDocumentPart, questionsPrompt, newThread);
                GroupedQuestionAnswers documentPartAnswers = getCompletion(message, responseJsonSchema, project, documentGroupWithQuestions, questionChunk);
                if (documentPartAnswers != null) {
                    partialAnswers.add(documentPartAnswers);
                }
            }

            if (partialAnswers.size() == 1) {
                logger.debug("Creating answers from a single document.");
                splitGroupAnswersToSeparateAnswerNodes(partialAnswers.get(0), documentGroupWithQuestions, answerNodeType, newAnswers);
            } else if (partialAnswers.size() > 1) {
                logger.debug("Creating answers from multiple document parts.");
                GroupedQuestionAnswers consolidatedDocumentAnswers = consolidatePartsAnswersToASingleOne(documentGroupWithQuestions, questionChunk, allQuestions, partialAnswers, newThread, responseJsonSchema);
                // error occurred, skipping...
                if (consolidatedDocumentAnswers == null) continue;

                splitGroupAnswersToSeparateAnswerNodes(consolidatedDocumentAnswers, documentGroupWithQuestions, answerNodeType, newAnswers);
            }

            logger.info("Processed TaskDocumentInsightsAnswerDTO: taskId={}, documentNodeId={}, questions # = {}",
                    documentGroupWithQuestions.getTaskId(),
                    documentGroupWithQuestions.getDocumentNode().getId(),
                    documentGroupWithQuestions.getQuestionNodes().size()
            );

        }

        batch.setNewAnswers(newAnswers);
        return batch;
    }

    private @Nullable GroupedQuestionAnswers consolidatePartsAnswersToASingleOne(TaskDocumentQuestionsDTO documentGroupWithQuestions, List<CompletionQuestionRequest> questionGroup, String allQuestions, List<GroupedQuestionAnswers> allAnswersFromDocumentParts, ChatThread newThread, ObjectNode responseJsonSchema) throws JsonProcessingException {
        StringBuilder prompt = new StringBuilder();
        prompt.append("""
           Big documents don't fit in the LLM context window; the document was split into parts.
           Each question may therefore have multiple partial answers. Consolidate them so that 
           *each questionId* has a single definitive answer
            
           Original questions:
           
           """);

        prompt.append(allQuestions).append("\n\n");

        for (int i = 0; i < allAnswersFromDocumentParts.size(); i++) {
            GroupedQuestionAnswers answers = allAnswersFromDocumentParts.get(i);
            if (answers.getCompletionAnswers().isEmpty()) {
                continue;
            }
            prompt.append("Answers for document part #").append(i + 1).append(":\n");

            try {
                prompt.append(objectMapper.writeValueAsString(answers.getCompletionAnswers())).append("\n\n");
            } catch (JsonProcessingException ignored) { }
        }

        Message message = new Message();
        message.setValue(prompt.toString());
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
            logger.warn("Response Completion message is: {}", response.getLast().getValue());
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

    /**
     * Groups questions by N
     * @param questions
     * @return
     */
    private @NotNull List<List<CompletionQuestionRequest>> chunkQuestionsToGroups(List<TaskNode> questions) {
        // Process the questions 10-by-10
        List<List<CompletionQuestionRequest>> chunks = new ArrayList<>();
        for (int i = 0; i < questions.size(); i += CHUNK_SIZE) {
            int end = Math.min(i + CHUNK_SIZE, questions.size());
            List<CompletionQuestionRequest> slice = new ArrayList<>();
            for (TaskNode q : questions.subList(i, end)) {
                slice.add(CompletionQuestionRequest.builder()
                        .questionId(q.getId())
                        .questionText(q.getNodeValue().getMessage())
                        .build());
            }
            chunks.add(slice);
        }
        return chunks;
    }

    private @NotNull List<List<DocumentInstanceSection>> groupSectionsBy100kTokens(UUID documentId) {
        var enc = encodingRegistry.getEncodingForModel(ModelType.GPT_4O);

        List<DocumentInstanceSection> sections = documentSectionService.getSectionsByDocument(documentId);
        sections.sort(Comparator.comparingInt(
                s -> s.getDocumentSectionMetadata().getSectionOrder()
        ));

        List<List<DocumentInstanceSection>> groups = new ArrayList<>();
        List<DocumentInstanceSection> currentGroup = new ArrayList<>();
        int currentTokens = 0;

        for (DocumentInstanceSection section : sections) {
            int sectionTokens = enc.encode(section.getSectionValue()).size();

            // if adding this section would overflow the 100k-token budget, flush
            if (currentTokens + sectionTokens > MAX_TOKENS && !currentGroup.isEmpty()) {
                groups.add(currentGroup);
                currentGroup = new ArrayList<>();
                currentTokens = 0;
            }
            currentGroup.add(section);
            currentTokens += sectionTokens;
        }
        // add the last group if non-empty
        if (!currentGroup.isEmpty()) {
            groups.add(currentGroup);
        }

        return groups;
    }

    private static ObjectNode buildResponseSchema() throws JsonProcessingException {
        String raw = JsonSchemaGenerator.generateForType(new org.springframework.core.ParameterizedTypeReference<GroupedQuestionAnswers>() {}.getType());
        ObjectMapper mapper = new ObjectMapper();
        JsonNode schemaNode = mapper.readTree(raw);
        ObjectNode wrapper = mapper.createObjectNode();
        wrapper.put("name", "json_response_with_actions");
        wrapper.set("schema", schemaNode);
        return wrapper;
    }


}

