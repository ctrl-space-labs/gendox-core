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
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.MessageLocalContext;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentCriteria;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;


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
    private TaskNodeService taskNodeService;
    private ObjectMapper objectMapper;
    private EncodingRegistry encodingRegistry;
    private Project project;
    private final DocumentService documentService;

    @Autowired
    public DocumentInsightsProcessor(TypeService typeService,
                                     TaskService taskService,
                                     ObjectMapper objectMapper,
                                     EncodingRegistry encodingRegistry,
                                     CompletionService completionService,
                                     ProjectService projectService,
                                     MessageService messageService,
                                     DocumentSectionService documentSectionService,
                                     TaskNodeService taskNodeService,
                                     DocumentService documentService) {
        this.typeService = typeService;
        this.taskService = taskService;
        this.objectMapper = objectMapper;
        this.encodingRegistry = encodingRegistry;
        this.completionService = completionService;
        this.projectService = projectService;
        this.messageService = messageService;
        this.documentSectionService = documentSectionService;
        this.taskNodeService = taskNodeService;
        this.documentService = documentService;
    }

    @Override
    public TaskAnswerBatchDTO process(TaskDocumentQuestionsDTO documentGroupWithQuestions) throws Exception {

        TaskAnswerBatchDTO batch = new TaskAnswerBatchDTO();

        /* 1 – Filter questions that are already answered (optionally delete old) */
        List<AnswerCreationDTO> newAnswers = new ArrayList<>();
        List<TaskNode> answeredQuestions = new ArrayList<>();
        List<TaskNode> answersToDelete = new ArrayList<>();

        documentGroupWithQuestions.getQuestionNodes().forEach(q ->
                taskNodeService.findAnswerNodeByDocumentAndQuestionOptional(
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

        List<List<CompletionQuestionRequest>> questionChunks = chunkQuestionsToGroups(task, documentGroupWithQuestions.getQuestionNodes());
        List<List<DocumentInstanceSection>> sectionChunks = groupSectionsBy100kTokens(task, documentGroupWithQuestions.getDocumentNode().getDocumentId());

        Page<DocumentInstance> mainDocSupportingDocuments = getSupportingDocuments(
                documentGroupWithQuestions.getDocumentNode());

        MessageLocalContext mainDocSupportingDocumentsContext = generateLocalContextForQuestion(
                documentGroupWithQuestions.getDocumentNode(),
                mainDocSupportingDocuments,
                "main-document");


        // For each question group
        questionLoop:
        for (List<CompletionQuestionRequest> questionChunk : questionChunks) {

            String allQuestions = objectMapper.writeValueAsString(questionChunk);
            String questionsPrompt = """
                    Answer the following questions based on the provided document:
                    
                    """ + allQuestions;

            List<GroupedQuestionAnswers> partialAnswers = new ArrayList<>();
            // a group of sections, is called a document part, each document might be splitted in 1, 2 or more parts (like 100K tokens per part)
            sectionsLoop:
            for (List<DocumentInstanceSection> groupedDocumentPart : sectionChunks) {

                ChatThread newThread = messageService.createThreadForMessage(List.of(project.getProjectAgent().getUserId()),
                        project.getId(),
                        "DOCUMENT_INSIGHTS - Task:" + task.getId());

                // TODO: Next steps:
                //  Investigate what to do with 'sistash orizontias idiokthsias' which is HUUUUUGE
                //  Extract all hardcoded strings to properties files
                //  Overwrite the default agent settings, from the settings in the task
                //  Add in the context the Task and Document prompt messages

                List<MessageLocalContext> supportingDocumentsContext = new ArrayList<>();
                supportingDocumentsContext.add(mainDocSupportingDocumentsContext);
                supportingDocumentsContext.addAll(questionChunk.stream().map(CompletionQuestionRequest::getQuestionSupportingDocsLocalContext).toList());
                supportingDocumentsContext.removeIf(Objects::isNull);

                Message message = buildPromptMessageForSections(groupedDocumentPart,
                        questionsPrompt,
                        newThread,
                        supportingDocumentsContext,
                        task,
                        documentGroupWithQuestions.getDocumentNode());
                GroupedQuestionAnswers documentPartAnswers = getCompletion(message, responseJsonSchema, project, documentGroupWithQuestions, questionChunk);
                if (documentPartAnswers == null) {
                    // ignore all partialAnswers, since there is an error, we cant trust any of those
                    logger.warn("Skipping whole question group, because of some error, and doc has multiple section chunks");
                    continue questionLoop;
                }

                partialAnswers.add(documentPartAnswers);

            }

            if (partialAnswers.size() == 1) {
                logger.debug("Creating answers from a single document.");
                splitGroupAnswersToSeparateAnswerNodes(partialAnswers.get(0), documentGroupWithQuestions, answerNodeType, newAnswers);
            } else if (partialAnswers.size() > 1) {
                logger.debug("Creating answers from multiple document parts.");
                GroupedQuestionAnswers consolidatedDocumentAnswers = consolidatePartsAnswersToASingleOne(documentGroupWithQuestions, questionChunk, allQuestions, partialAnswers, null, responseJsonSchema, task);
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

    private @Nullable GroupedQuestionAnswers consolidatePartsAnswersToASingleOne(TaskDocumentQuestionsDTO documentGroupWithQuestions, List<CompletionQuestionRequest> questionGroup, String allQuestions, List<GroupedQuestionAnswers> allAnswersFromDocumentParts, ChatThread newThread, ObjectNode responseJsonSchema, Task task) throws JsonProcessingException {
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

        if (newThread == null) {
            newThread = messageService.createThreadForMessage(List.of(project.getProjectAgent().getUserId()),
                    project.getId(),
                    "DOCUMENT_INSIGHTS - Task:" + task.getId());
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

    private Message buildPromptMessageForSections(List<DocumentInstanceSection> sectionGroup,
                                                  String questionsPrompt,
                                                  ChatThread newThread,
                                                  List<MessageLocalContext> localContext,
                                                  Task task,
                                                  TaskNode documentNode) {
        String textSections = sectionGroup.stream()
                .map(DocumentInstanceSection::getSectionValue)
                .reduce("", (a, b) -> a + "\n\n" + b);

        // Main document is 1st in local context, to increase LLM cache hit rate
        addMainDocumentText(localContext, textSections);

        // task prompt, if exists, is 2nd in local context
        addTaskPromptIfExists(localContext, task);

        // document prompt, if exists, is 3rd in local context
        addDocumentPromptIfExists(localContext, documentNode);


        String prompt = """
            You are an AI assistant that answers questions for the **Main Document Text**, based on provided supporting documents.            
            
            Please answer the following questions:
            \"\"\"\"\"
            %s
            \"\"\"\"\"
            
            1. Read the above questions to be answered for the main document.
            2. Use the available tools to load and read the related supporting documents, if needed. You will find the supporting documents in the Session Context in the beginning of this message.
            3. The tool result loads the supporting documents in the context.
            4. Then answer the questions for the **Main Document Text** based using the supporting documents as reference.
            """.formatted(questionsPrompt);

        Message message = new Message();
        message.setValue(prompt);
        message.setThreadId(newThread.getId());
        message.setProjectId(project.getId());
        message.setCreatedBy(project.getProjectAgent().getUserId());
        message.setUpdatedBy(project.getProjectAgent().getUserId());
        message = messageService.createMessage(message);

        // add after creations as the local context is not saved
        message.setLocalContexts(localContext);
        return message;
    }

    private static void addDocumentPromptIfExists(List<MessageLocalContext> localContext, TaskNode documentNode) {
        if (Optional.ofNullable(documentNode)
                .map(n -> n.getNodeValue())
                .map(v -> v.getDocumentMetadata())
                .map(m -> m.getPrompt())
                .filter(StringUtils::hasText)
                .isPresent()) {


            MessageLocalContext documentPrompt = MessageLocalContext.builder()
                    .contextType(Type.builder().name("**Instructions to follow, and information to know, for this specific [Main Document]**").build())
                    .value("""
                            
                            \"\"\"\"\"
                            %s
                            \"\"\"\"\"
                            """.formatted(documentNode.getNodeValue().getDocumentMetadata().getPrompt()))
                    .build();
            localContext.add(2, documentPrompt);
        }
    }

    private static void addTaskPromptIfExists(List<MessageLocalContext> localContext, Task task) {
        if (task.getTaskPrompt() != null && !task.getTaskPrompt().isBlank()) {
            MessageLocalContext taskPrompt = MessageLocalContext.builder()
                    .contextType(Type.builder().name("**General instructions to follow for the processing**").build())
                    .value("""
                            
                            \"\"\"\"\"
                            %s
                            \"\"\"\"\"
                            """.formatted(task.getTaskPrompt()))
                    .build();
            localContext.add(1, taskPrompt);
        }
    }

    private static void addMainDocumentText(List<MessageLocalContext> localContext, String textSections) {
        MessageLocalContext mainDocumentContext = MessageLocalContext.builder()
                .contextType(Type.builder().name("**[Main Document] Text**").build())
                .value("""
                        
                        \"\"\"\"\"
                        %s
                        \"\"\"\"\"
                        """.formatted(textSections))
                .build();
        localContext.add(0, mainDocumentContext);
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
                    documentGroupWithQuestions.getDocumentNode().getDocumentId(),
                    questionGroup.stream().map(CompletionQuestionRequest::getQuestionId).toList());
            return null;

        } catch (JsonProcessingException | IllegalArgumentException e) {
            logger.warn("Error converting Json completion to GroupedQuestionAnswers, message: {}, error: {}", message.getId(), e.getMessage());
            logger.warn("Response Completion message is: {}", response.getLast().getValue());
            logger.warn("Skipping processing documentId: {} fpr the questions: {}.",
                    documentGroupWithQuestions.getDocumentNode().getDocumentId(),
                    questionGroup.stream().map(CompletionQuestionRequest::getQuestionId).toList());
            return null;
        } catch (Exception e) {
            logger.warn("Unexpected error during completion for message: {}, error: {}", message.getId(), e.getMessage());
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
            taskNodeService.findAnswerNodeByDocumentAndQuestionOptional(
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
     * Packs questions into buckets of ≤10 items and ≤10_000 tokens,
     * back‑filling any earlier bucket that still has room.
     */
    public @NotNull List<List<CompletionQuestionRequest>> chunkQuestionsToGroups(Task task, List<TaskNode> questions) throws GendoxException {
        var enc = encodingRegistry.getEncodingForModel(ModelType.GPT_4O);

        List<List<CompletionQuestionRequest>> buckets = new ArrayList<>();
        // Parallel list to track the token sum of each bucket:
        List<Integer> bucketTokenSums           = new ArrayList<>();
        List<CompletionQuestionRequest> single; // temp for >limit questions

        for (TaskNode q : questions) {
            String text = q.getNodeValue().getMessage();
            Page<DocumentInstance> supportingDocuments = getSupportingDocuments(q);

            int qTokens = countQuestionTokens(enc, text, supportingDocuments);

            MessageLocalContext localContext = generateLocalContextForQuestion(q, supportingDocuments, "questions");

            CompletionQuestionRequest req = CompletionQuestionRequest.builder()
                    .questionId(q.getId())
                    .questionText(text)
                    .questionSupportingDocsLocalContext(localContext)
                    .build();

            // TODO: (@see #472 ) Add in create question an LLM call to identify if supporting documents are needed,
            //  if yes, the question will have to be executed alone, without other questions in the same bucket
            // 1) If this question alone exceeds the token limit → its own bucket
            if (qTokens > task.getMaxQuestionTokensPerBucket()) {
                single = Collections.singletonList(req);
                buckets.add(single);
                bucketTokenSums.add(qTokens);
                continue;
            }

            // 2) Try to first‑fit into an existing bucket
            boolean placed = false;
            for (int i = 0; i < buckets.size(); i++) {
                List<CompletionQuestionRequest> bucket = buckets.get(i);
                int currentSum = bucketTokenSums.get(i);

                if (bucket.size() < task.getMaxQuestionsPerBucket()
                        && currentSum + qTokens <= task.getMaxQuestionTokensPerBucket())
                {
                    bucket.add(req);
                    bucketTokenSums.set(i, currentSum + qTokens);
                    placed = true;
                    break;
                }
            }

            // 3) If it didn’t fit anywhere, start a fresh bucket
            if (!placed) {
                List<CompletionQuestionRequest> newBucket = new ArrayList<>();
                newBucket.add(req);
                buckets.add(newBucket);
                bucketTokenSums.add(qTokens);
            }
        }

        return buckets;
    }

    private static int countQuestionTokens(Encoding enc, String text, Page<DocumentInstance> supportingDocuments) {
        int    qTokens = enc.countTokens(text);
        // If it isn't int, we should be rich :)
        qTokens += (int) supportingDocuments.stream()
                .mapToLong(DocumentInstance::getTotalTokens)
                .sum();
        return qTokens;
    }

    private Page<DocumentInstance> getSupportingDocuments(TaskNode node) throws GendoxException {
        if (node.getNodeValue().getSupportingDocumentIds() == null ||
                node.getNodeValue().getSupportingDocumentIds().isEmpty()) {
            return Page.empty();
        }
        DocumentCriteria supportingDocsCriteria = DocumentCriteria.builder()
                .documentInstanceIds(node.getNodeValue().getSupportingDocumentIds().stream().map(UUID::toString).toList())
                .build();
        Page<DocumentInstance> supportingDocuments = documentService.getAllDocuments(supportingDocsCriteria, Pageable.unpaged());
        return supportingDocuments;
    }

    /**
     * Generates a local context representing the supporting documents for a given question.
     * *
     *
     * @param q
     * @param supportingDocuments
     * @param supportingDocumentDirName like 'questions' will return -> ./supporting-documents/questions/[question_id]/doc_name.pdf
     * @return
     */
    private static @Nullable MessageLocalContext generateLocalContextForQuestion(TaskNode q, Page<DocumentInstance> supportingDocuments, String supportingDocumentDirName) {
        if (q.getNodeValue().getSupportingDocumentIds() == null ||
                q.getNodeValue().getSupportingDocumentIds().isEmpty()) {
            return null;
        }
        StringBuilder sb = new StringBuilder();
        sb.append("./supporting-documents").append("\n");
        sb.append("./supporting-documents/").append(supportingDocumentDirName).append("\n");
        sb.append("./supporting-documents/").append(supportingDocumentDirName).append("/").append(q.getId()).append("\n");
        for (DocumentInstance doc : supportingDocuments.getContent()) {
            sb.append("./supporting-documents/").append(supportingDocumentDirName).append("/").append(q.getId()).append("/")
                    .append(doc.getTitle())
                    .append(" | size=").append(doc.getFileSizeBytes()/1024).append("KB")
                    .append(" | pages=").append(doc.getNumberOfPages())
                    .append(" | UUID=").append(doc.getId())
                    .append("\n");
        }
        MessageLocalContext localContext = MessageLocalContext.builder()
                .contextType(Type.builder().name("Supporting Documents").build())
                .value(sb.toString())
                .build();
        return localContext;
    }

    private @NotNull List<List<DocumentInstanceSection>> groupSectionsBy100kTokens(Task task, UUID documentId) {
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
            if (currentTokens + sectionTokens > task.getMaxSectionsChunkTokens() && !currentGroup.isEmpty()) {
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

