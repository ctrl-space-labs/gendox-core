package dev.ctrlspace.gendox.spring.batch.jobs.documentInsights.steps;


import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.knuddels.jtokkit.api.Encoding;
import com.knuddels.jtokkit.api.EncodingRegistry;
import com.knuddels.jtokkit.api.ModelType;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.MessageLocalContextConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionRuntimeOverridesDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.MessageLocalContextDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.*;
import dev.ctrlspace.gendox.gendoxcoreapi.services.*;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.CancellationToken;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskNodeTypeConstants;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.tools.ToolDeclarationStrings;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.util.json.schema.JsonSchemaGenerator;
import org.springframework.batch.core.StepExecution;
import org.springframework.batch.core.annotation.BeforeStep;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.core.task.TaskExecutor;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;


@Component
@StepScope
public class DocumentInsightsProcessor implements ItemProcessor<TaskDocumentQuestionsDTO, TaskAnswerBatchDTO> {

    private static final Logger logger = LoggerFactory.getLogger(DocumentInsightsProcessor.class);
    private final JobService jobService;

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
    private MessageLocalContextConverter messageLocalContextConverter;
    private StepExecution stepExecution;
    private final TaskExecutor asyncInsightsLlmCompletionsExecutor;

    @BeforeStep
    public void setStepExecution(StepExecution stepExecution) {
        this.stepExecution = stepExecution;
    }

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
                                     DocumentService documentService,
                                     MessageLocalContextConverter messageLocalContextConverter,
                                     JobService jobService,
                                     TaskExecutor asyncInsightsLlmCompletionsExecutor) {
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
        this.messageLocalContextConverter = messageLocalContextConverter;
        this.jobService = jobService;
        this.asyncInsightsLlmCompletionsExecutor = asyncInsightsLlmCompletionsExecutor;
    }

    @Override
    public TaskAnswerBatchDTO process(TaskDocumentQuestionsDTO documentGroupWithQuestions) throws Exception {

        TaskAnswerBatchDTO batch = new TaskAnswerBatchDTO();

        /* 1 – Filter questions that are already answered (optionally delete old) */
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
            answeredQuestions.clear();  // nothing to delete in this case
            if (documentGroupWithQuestions.getQuestionNodes().isEmpty()) {
                return null; // nothing left to process
            }
        }


        Type answerNodeType = typeService.getTaskNodeTypeByName(TaskNodeTypeConstants.ANSWER);
        Task task = taskService.getTaskById(documentGroupWithQuestions.getTaskId());
        if (project == null) {
            project = projectService.getProjectById(task.getProjectId());
        }
        CompletionRuntimeOverridesDTO overrides = taskService.buildDefaultCompletionOverrides(task);

        // TODO - this makes it implicitly a "DeepThinking" completion. Update this to be declared explicitly
        CancellationToken cancellationToken = new CancellationToken(
                () -> isCancellationRequested(stepExecution));
        overrides.setCancellationToken(cancellationToken);

        // TODO - add subagent tool, move it to a propper place
//        AiTools subAgentTool = new AiTools();
//        subAgentTool.setType("function");
//        subAgentTool.setJsonSchema(ToolDeclarationStrings.CREATE_SUB_AGENT);
//        overrides.getAiTools().add(subAgentTool);
//        List<MessageLocalContextDTO> subAgents = new ArrayList<>();
//        MessageLocalContextDTO plannerAgentDescriptionContext = MessageLocalContextDTO.builder()
//                .contextType("sub-agent")
//                .value("""
//                        SubAgent name: Planner
//                        Role: create a plan for analyzing contracts. Analyzes the questions asked for a contract and create a step by step plan on how to answer them, which tools to use, and in which order. In general the available tools and other sub-agents that exist are: 1. Summering a contract and extracting information needed to be reviewed to answer the question (e.g 'extract all financial info, to review payment related questions' or 'extract all property related info and codes to then review architecture diagrams'), 2. A document shortener sub-agent the will review huge documents and will describe the parts that are related for our contract. \n\n A planning session could be like:\n1.Summarize the Main Contract for related to [..that..] information\n2. Extract from Systash Orizontias idioktisias only the parts that are related to the Main Contract\n3. Compare the main contract with the extracted text parts from Systash
//                        """)
//                .build();
//        MessageLocalContextDTO summarizerAgentDescriptionContext = MessageLocalContextDTO.builder()
//                .contextType("sub-agent")
//                .value("""
//                        SubAgent name: Summarizer
//                        Role: summarize documents, or parts of documents, to extract the needed information to answer the questions. For example, if the question is 'What are the payment terms in the contract?' and the document is a 100 pages contract, this agent should review the contract and extract all payment related information, to then provide it as context for answering the question.
//                        """)
//                .build();
//        MessageLocalContextDTO textExtractorAgentDescriptionContext = MessageLocalContextDTO.builder()
//                .contextType("sub-agent")
//                .value("""
//                        SubAgent name: Text Extractor
//                        Role: <Document>
//                            ......
//                            </Document>
//
//                            For the above document, I need you to extract any text parts that are refering to the bellow <summary>.
//                            The output must be a json array list with line_start and line_end fields describing sections that are related the the bellow question.
//
//                            These are text parts that are related to the <summary>. After your export, those parts will be used to cross check the summary with the original text. your goal is not to miss any related sections, be generus with your selection, and remove the parts that are completly unrelated.
//
//                            The summary:
//
//                            <summary>
//                            .....
//                            </summary>
//
//
//                            If any of the above is referred to the document, the whole paragraph should be extracted.
//
//                            Example output:
//                            [
//                            {line_start: 1, line_end: 25},
//                            {line_start: 100, line_end: 200},
//                            {line_start: 500, line_end: 800},
//                            {line_start: 23, line_end: 80},
//                            ]"
//
//                        """)
//                .build();
//        MessageLocalContextDTO paralegalAgentDescriptionContext = MessageLocalContextDTO.builder()
//                .contextType("sub-agent")
//                .value("""
//                        SubAgent name: Paralegal
//                        Role: A paralegal subagent retrieves and reviews legal documents, identifies the sections relevant to the task, and performs focused comparisons, checks, and analysis across them.
//                              It then delivers a concise, structured answer that highlights key findings, discrepancies, and the specific document passages that support its conclusion.
//                              In the task description should pass the UUIDs of the documents that need to be processed, and the questions that need to be answered. The paralegal will then read the document content, find the relevant sections in those documents, review them, and answer the questions based on them.
//                        """)
//                .build();
//        subAgents.add(plannerAgentDescriptionContext);
//        subAgents.add(summarizerAgentDescriptionContext);
//        subAgents.add(textExtractorAgentDescriptionContext);
//        subAgents.add(paralegalAgentDescriptionContext);

//        MessageLocalContextDTO legalReviewSkills = MessageLocalContextDTO.builder()
//                .contextType("legal_review_skills")
//                .value("""
//                        <skills>
//                        :: bellow are skills on how to review legal documents.
//
//                        When Reviewing a document trying to answer in specific questions, is is always usefull to create a plan first.
//
//                        Many questions, might require to piece information from multiple parts of the document. You can create a summary of the document related to this question eg. Summarize it related to all payments and the payment plan, or summarize it related to the buys seller and the people involved, or summarize it related to all the codes of properties referred to the doc.\s
//                        To avoid cognitive load, you can delegate this to the Summarizer sub-agent by calling the appropriate tool. The Summarizer sub-agent will receive the full chat history as context, so dont repeat the information, just give instructions what to summarize from the previous discussion.\s
//
//                        You can use the regex_search tool to find specific information in the document, for example search for amounts, or code articles, or for placeholders.
//
//                        Typically placeholders are in brackets, and some might have escaped characters, like [•], [...], \\[...\\], [DATE], [FULL NAME], [Name], {Name}, {First Name}, {...}, \\{Name\\}, ......, or other variations. You can use regexes to find all of them, and then review them to find the relevant ones for the question you need to answer.
//
//                        If you need to compare 2 documents, you can use the diff_documents tool, it will return a patch with all the differences between the 2 documents, and you can review the differences to find the relevant ones for the question you need to answer.
//
//                        Because comparing the documents adds both documents content to the context, delegate this to a subagent, and ask it to compare those documents by providing their UUIDs and ask to give you a consolidated answer about the question. The sub-agent is expected to use the diff_documents tool, and then review the differences to give you a consolidated answer.
//
//                        Usually you use the read_document too read the content of the document, it gets the UUID as a param. In read cases the tool gets also a range of lines to read from the doc. This is mainly used in the results of the SectionExtractor sub-agent, that finds the relevant sections in the document (see bellow).\s
//
//                        The SectionExtractor sub-agent is responsible to read documents that are huge, usually they are supporting documents for the contract review. This subagent reads the document, reviews it, and returns the line ranges that are related to the contract and the question. The main agent then uses the line ranges to read only the relevant sections from the document, and then answer the question based on those sections.
//
//                        SectionExtractor sub-agent receives from the main agent the document UUID to read and the summary of the main document that needs to be reviewed, and it is expected to return the line ranges that are related to the summary.\s
//
//                        1. Αν η ερώτηση είναι για σύγκριση με το template τότε πρέπει:
//                        -  να φτιάξεις έναν sub agent με create_sub_agent\s
//                        - Στο task description θα δώσεις το document id (UUID) του συμβολαίου και το document id (UUID) του template που θα διαλέξεις από την λίστα των templete files.\s
//                        - Στο task description θα του ζητήσεις να χρησιμοποιήσει το diff_document tool, για να δει τις διαφορές
//                        - Στο task description θα του ζητήσεις να σου απαντήσει με λεπτομέρεια για το τι αλλαγές υπάρχουν. Προσάρμοσε ακριβώς τι θα του ζητήσεις και σε συνδυασμό με την ερώτηση του χρήστη
//
//                        2. Αν η ερώτηση είναι για σύγκριση με την σύσταση οριζόντιας ιδιοκτησίας (που είναι τεράστιο), τότε:
//                        - Θα φτιάξεις έναν Summarize agent και θα του ζητήσεις  να κάνει μια λεπτομερή περίληψη του συμβολαίου σε σχέση με όλους τους κωδικούς ακινήτων που αναφέρονται στην ερώτηση και στο συμβόλαιο
//                        - θα πάρεις αυτή την περίληψη, και θα την δώσεις στον Extractor Agent (extract_relevant_sections tool) μαζί με το document id (UUID) του αρχείου της σύστασης θα του ζητήσεις να σου βρει όλα τα line ranges που περιγράφουν τα στοιχεία του ακινήτου, χρειαζόμαστε όλα τα παρακάτω ranges που αναφέρονται στο συγκεκριμένο συμβόλαιο. αυτά συνήθως βρίσκονται:
//                            - στην αρχή της σύστασης, σε σχέση με το οικόπεδο και το κτίριο
//                            - μετά ακολουθεί μια περιοχή που περιγράφονται οι αποθήκες και οι θέσεις parking
//                            - μετά ακολουθεί η περιγραφή των ίδιων των σπιτιών
//                        - ο extractor agent θα σου επιστρέψει τα ranges, μετά εσύ θα χρησιμοποιήσει το read_document με ranges για να διαβάσεις από την σύσταση αυτά τα line ranges
//                        - από τα ranges που θα διαβάσεις θα δώσεις μια συνεκτική απάντηση, αν τα ranges δεν αρκούν, τότε ξαναζήτα από τον extractor να συμπληρώσει το selection
//
//                        3. Αν η ερώτηση αφορά έλεγχο οικονομικών στοιχείων τότε:
//                        - Ζήτα από τον summirize να σου κάνει μια λεπτομερή περίληψη για όλα τα οικονομικά στοιχεία που εμφανίζονται στο συμβόλαιο.
//                        - Αν δεν σου αρκεί, ξαναχρησιμοποίησε το summarize tool με περισσότερες λεπτομέρειες (αυτό θα είναι νέο summarize instance, θα έχει το ίδιο context που έχεις εσύ μέχρι τώρα)
//                        - με την περίληψη που θα πάρεις, διάβασε ότι άλλο υποστηρικτικό έγγραφο χρειάζεσαι (read_document)
//                        - αφού συγκεντρώσεις όλες τις πληροφορίες, δώσε την συνεκτικά απάντηση στην ερώτηση του χρήστη
//                        </skills>
//
//                        """)
//                .build();



        ObjectNode responseJsonSchema = buildResponseSchema(new org.springframework.core.ParameterizedTypeReference<GroupedQuestionAnswers>() {
        });

        List<List<CompletionQuestionRequest>> questionChunks = chunkQuestionsToGroups(task, documentGroupWithQuestions.getQuestionNodes());
        List<List<DocumentInstanceSection>> sectionChunks = groupSectionsBy100kTokens(task, documentGroupWithQuestions.getDocumentNode().getDocumentId());

        DocumentInstance mainDocument = sectionChunks.stream()
                .flatMap(List::stream)
                .map(DocumentInstanceSection::getDocumentInstance)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);
        String mainDocumentTitle = mainDocument != null ? mainDocument.getTitle() : null;
        UUID mainDocumentId = mainDocument != null ? mainDocument.getId() : documentGroupWithQuestions.getDocumentNode().getDocumentId();

        Page<DocumentInstance> mainDocSupportingDocuments = getSupportingDocuments(
                documentGroupWithQuestions.getDocumentNode());

        MessageLocalContextDTO mainDocSupportingDocumentsContext = generateLocalContextForQuestion(
                documentGroupWithQuestions.getDocumentNode(),
                mainDocSupportingDocuments,
                "main-document");

        List<CompletableFuture<List<AnswerCreationDTO>>> questionsChunkCompletionFutures = new ArrayList<>();
        for (List<CompletionQuestionRequest> questionChunk : questionChunks) {
            CompletableFuture<List<AnswerCreationDTO>> future = CompletableFuture
                    .supplyAsync(() -> {
                        try {
                            return processQuestionChunk(questionChunk,
                                    sectionChunks,
                                    documentGroupWithQuestions,
                                    task,
                                    answerNodeType,
                                    responseJsonSchema,
                                    overrides,
                                    mainDocSupportingDocumentsContext,
                                    mainDocumentTitle,
                                    mainDocumentId);
                        } catch (Exception e) {
                            throw new RuntimeException(e);
                        }
                    }, asyncInsightsLlmCompletionsExecutor)
                    .handle((answers, throwable) -> {
                        if (throwable != null) {
                            logger.error("Failed to process insights completion for docNode {}: ",
                                    documentGroupWithQuestions.getDocumentNode().getId(), throwable);
                            return List.<AnswerCreationDTO>of();
                        }
                        return answers == null ? List.<AnswerCreationDTO>of() : answers;
                    });
            questionsChunkCompletionFutures.add(future);
        }

        CompletableFuture.allOf(questionsChunkCompletionFutures.toArray(new CompletableFuture[0])).join();

        List<AnswerCreationDTO> newAnswers = questionsChunkCompletionFutures.stream()
                .flatMap(f -> f.join().stream())
                .collect(Collectors.toList());

        batch.setNewAnswers(newAnswers);
        return batch;
    }

    private @NotNull List<AnswerCreationDTO> processQuestionChunk(List<CompletionQuestionRequest> questionChunk,
                                                                  List<List<DocumentInstanceSection>> sectionChunks,
                                                                  TaskDocumentQuestionsDTO documentGroupWithQuestions,
                                                                  Task task,
                                                                  Type answerNodeType,
                                                                  ObjectNode responseJsonSchema,
                                                                  CompletionRuntimeOverridesDTO overrides,
                                                                  MessageLocalContextDTO mainDocSupportingDocumentsContext,
                                                                  @Nullable String mainDocumentTitle,
                                                                  @Nullable UUID mainDocumentId) throws JsonProcessingException {

        List<AnswerCreationDTO> newAnswers = new ArrayList<>();

        String allQuestions = objectMapper.writeValueAsString(questionChunk);
        String questionsPrompt = """
                Answer the following questions based on the provided document:
                
                """ + allQuestions;

        List<GroupedQuestionAnswers> partialAnswers = new ArrayList<>();
        int lineNo = 1;
        // a group of sections, is called a document part, each document might be splitted in 1, 2 or more parts (like 100K tokens per part)
        for (List<DocumentInstanceSection> groupedDocumentPart : sectionChunks) {

            ChatThread newThread = messageService.createThreadForMessage(List.of(project.getProjectAgent().getUserId()),
                    project.getId(),
                    "DOCUMENT_INSIGHTS - Task:" + task.getId());

            List<MessageLocalContextDTO> supportingDocumentsContext = new ArrayList<>();
            supportingDocumentsContext.add(mainDocSupportingDocumentsContext);
            supportingDocumentsContext.addAll(questionChunk.stream().map(CompletionQuestionRequest::getQuestionSupportingDocsLocalContext).toList());
            supportingDocumentsContext.removeIf(Objects::isNull);

            NumberedText numberedText = buildNumberedTextSections(groupedDocumentPart, lineNo);
            lineNo = numberedText.nextLineNo();

            Message message = buildPromptMessageForSections(numberedText.text(),
                    questionsPrompt,
                    newThread,
                    supportingDocumentsContext,
                    task,
                    documentGroupWithQuestions.getDocumentNode(),
                    mainDocumentTitle,
                    mainDocumentId);
            GroupedQuestionAnswers documentPartAnswers = getCompletion(message, responseJsonSchema, project, documentGroupWithQuestions, questionChunk, overrides);
            if (documentPartAnswers == null) {
                // ignore all partialAnswers, since there is an error, we cant trust any of those
                logger.warn("Skipping whole question group, because of some error, and doc has multiple section chunks");
                return List.of();
            }

            partialAnswers.add(documentPartAnswers);
        }

        if (partialAnswers.size() == 1) {
            logger.debug("Creating answers from a single document.");
            splitGroupAnswersToSeparateAnswerNodes(partialAnswers.get(0), documentGroupWithQuestions, answerNodeType, newAnswers);
        } else if (partialAnswers.size() > 1) {
            logger.debug("Creating answers from multiple document parts.");
            GroupedQuestionAnswers consolidatedDocumentAnswers = consolidatePartsAnswersToASingleOne(documentGroupWithQuestions, questionChunk, allQuestions, partialAnswers, null, responseJsonSchema, task, overrides);
            // error occurred, skipping...
            if (consolidatedDocumentAnswers == null) return List.of();

            splitGroupAnswersToSeparateAnswerNodes(consolidatedDocumentAnswers, documentGroupWithQuestions, answerNodeType, newAnswers);
        }

        logger.info("Processed TaskDocumentInsightsAnswerDTO: taskId={}, documentNodeId={}, questions # = {}",
                documentGroupWithQuestions.getTaskId(),
                documentGroupWithQuestions.getDocumentNode().getId(),
                documentGroupWithQuestions.getQuestionNodes().size()
        );

        return newAnswers;
    }

    private @Nullable GroupedQuestionAnswers consolidatePartsAnswersToASingleOne(TaskDocumentQuestionsDTO documentGroupWithQuestions, List<CompletionQuestionRequest> questionGroup, String allQuestions, List<GroupedQuestionAnswers> allAnswersFromDocumentParts, ChatThread newThread, ObjectNode responseJsonSchema, Task task, CompletionRuntimeOverridesDTO overrides) throws JsonProcessingException {
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
            } catch (JsonProcessingException ignored) {
            }
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

        GroupedQuestionAnswers consolidatedDocumentAnswers = getCompletion(message, responseJsonSchema, project, documentGroupWithQuestions, questionGroup, overrides);
        return consolidatedDocumentAnswers;
    }

    private Message buildPromptMessageForSections(String textSections,
                                                  String questionsPrompt,
                                                  ChatThread newThread,
                                                  List<MessageLocalContextDTO> localContext,
                                                  Task task,
                                                  TaskNode documentNode,
                                                  String mainDocumentTitle,
                                                  UUID mainDocumentId) {
        // Main document is 1st in local context, to increase LLM cache hit rate
        addMainDocumentText(localContext, textSections, mainDocumentTitle, mainDocumentId);

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
        message.setLocalContexts(
                messageLocalContextConverter.toEntities(message, localContext)
        );

        message = messageService.createMessage(message);
        return message;
    }

    private record NumberedText(String text, int nextLineNo) {}

    private static @NotNull NumberedText buildNumberedTextSections(@NotNull List<DocumentInstanceSection> sectionGroup,
                                                                   int startLineNo) {
        StringBuilder sb = new StringBuilder();
        int lineNo = startLineNo;

        for (int sectionIdx = 0; sectionIdx < sectionGroup.size(); sectionIdx++) {
            String sectionText = Optional.ofNullable(sectionGroup.get(sectionIdx))
                    .map(DocumentInstanceSection::getSectionValue)
                    .orElse("");

            // Keep empty lines (and trailing empty line if present) so numbering is stable.
            String[] lines = sectionText.split("\\R", -1);
            for (String line : lines) {
                sb.append(lineNo++).append(" | ").append(line).append("\n");
            }

            // Visual separator between sections (also numbered).
            if (sectionIdx < sectionGroup.size() - 1) {
                sb.append(lineNo++).append(" | ").append("\n");
            }
        }

        return new NumberedText(sb.toString(), lineNo);
    }

    private static void addDocumentPromptIfExists(List<MessageLocalContextDTO> localContext, TaskNode documentNode) {
        if (Optional.ofNullable(documentNode)
                .map(n -> n.getNodeValue())
                .map(v -> v.getDocumentMetadata())
                .map(m -> m.getPrompt())
                .filter(StringUtils::hasText)
                .isPresent()) {


            MessageLocalContextDTO documentPrompt = MessageLocalContextDTO.builder()
                    .contextType("**Instructions to follow, and information to know, for this specific [Main Document]**")
                    .value("""
                            
                            \"\"\"\"\"
                            %s
                            \"\"\"\"\"
                            """.formatted(documentNode.getNodeValue().getDocumentMetadata().getPrompt()))
                    .build();
            localContext.add(2, documentPrompt);
        }
    }

    private static void addTaskPromptIfExists(List<MessageLocalContextDTO> localContext, Task task) {
        if (task.getTaskPrompt() != null && !task.getTaskPrompt().isBlank()) {
            MessageLocalContextDTO taskPrompt = MessageLocalContextDTO.builder()
                    .contextType("**General instructions to follow for the processing**")
                    .value("""
                            
                            \"\"\"\"\"
                            %s
                            \"\"\"\"\"
                            """.formatted(task.getTaskPrompt()))
                    .build();
            localContext.add(1, taskPrompt);
        }
    }

    private static void addMainDocumentText(List<MessageLocalContextDTO> localContext,
                                            String textSections,
                                            @Nullable String mainDocumentTitle,
                                            @Nullable UUID mainDocumentId) {
        MessageLocalContextDTO mainDocumentContext = MessageLocalContextDTO.builder()
                .contextType("**[Main Document] Text**")
                .value("""
                        
                        ./main-document/%s | UUID=%s
                        <document-text>
                        %s
                        </document-text>
                        """.formatted(
                        Optional.ofNullable(mainDocumentTitle).orElse(""),
                        Optional.ofNullable(mainDocumentId).map(UUID::toString).orElse(""),
                        textSections
                ))
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

    private @Nullable GroupedQuestionAnswers getCompletion(Message message, ObjectNode responseJsonSchema, Project project, TaskDocumentQuestionsDTO documentGroupWithQuestions, List<CompletionQuestionRequest> questionGroup, CompletionRuntimeOverridesDTO overrides) {
        GroupedQuestionAnswers answers;
        List<Message> response = null;
        try {
            response = completionService.getCompletion(message, new ArrayList<>(), project, responseJsonSchema, overrides);
            answers = objectMapper.readValue(response.getLast().getValue(), GroupedQuestionAnswers.class);
        } catch (GendoxException e) {
            logger.warn("Error getting completion for message: {}, error: {}", message.getId(), e.getMessage());
            logger.warn("Skipping processing documentId: {} for the questions: {}.",
                    documentGroupWithQuestions.getDocumentNode().getDocumentId(),
                    questionGroup.stream().map(CompletionQuestionRequest::getQuestionId).toList());
            return null;

        } catch (JsonProcessingException | IllegalArgumentException e) {
            logger.warn("Error converting Json completion to GroupedQuestionAnswers, message: {}, error: {}", message.getId(), e.getMessage(), e);
            if (response.getLast() != null) {
                logger.warn("Response Completion message is: {}", response.getLast().getValue());
            }
            logger.warn("Skipping processing documentId: {} fpr the questions: {}.",
                    documentGroupWithQuestions.getDocumentNode().getDocumentId(),
                    questionGroup.stream().map(CompletionQuestionRequest::getQuestionId).toList());
            return null;
        } catch (Exception e) {
            logger.warn("Unexpected error during completion for message: {}, error: {}", message.getId(), e.getMessage(), e);
            return null;
        }
        return answers;
    }

    /**
     * Scans all question nodes in the given document group and collects any existing
     * answer nodes along with their corresponding questions.
     *
     * @param documentGroupWithQuestions the DTO containing the document and its questions
     * @param existingAnswers            a list to be populated with found answer nodes
     * @param answeredQuestions          a list to be populated with questions that already have answers
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
        List<Integer> bucketTokenSums = new ArrayList<>();
        List<CompletionQuestionRequest> single; // temp for >limit questions

        for (TaskNode q : questions) {
            String text = q.getNodeValue().getMessage();
            Page<DocumentInstance> supportingDocuments = getSupportingDocuments(q);

            int qTokens = countQuestionTokens(enc, text, supportingDocuments);

            MessageLocalContextDTO localContext = generateLocalContextForQuestion(q, supportingDocuments, "questions");

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
                        && currentSum + qTokens <= task.getMaxQuestionTokensPerBucket()) {
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
        int qTokens = enc.countTokens(text);
        // If it isn't int, we should be rich :)
        qTokens += (int) supportingDocuments.stream()
                .mapToLong(doc -> doc.getTotalTokens() == null ? 0L : doc.getTotalTokens())
                .sum();
        return qTokens;
    }

    private Page<DocumentInstance> getSupportingDocuments(TaskNode node) throws GendoxException {
        if (node.getNodeValue().getDocumentMetadata() == null) {
            return Page.empty();
        }
        if (node.getNodeValue().getDocumentMetadata().getSupportingDocumentIds() == null ||
                node.getNodeValue().getDocumentMetadata().getSupportingDocumentIds().isEmpty()) {
            return Page.empty();
        }
        DocumentCriteria supportingDocsCriteria = DocumentCriteria.builder()
                .documentInstanceIds(node.getNodeValue().getDocumentMetadata().getSupportingDocumentIds().stream().map(UUID::toString).toList())
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
    private static @Nullable MessageLocalContextDTO generateLocalContextForQuestion(TaskNode q, Page<DocumentInstance> supportingDocuments, String supportingDocumentDirName) {
        if (q.getNodeValue().getDocumentMetadata() == null ||
                q.getNodeValue().getDocumentMetadata().getSupportingDocumentIds() == null ||
                q.getNodeValue().getDocumentMetadata().getSupportingDocumentIds().isEmpty()) {
            return null;
        }
        StringBuilder sb = new StringBuilder();
        sb.append("./supporting-documents").append("\n");
        sb.append("./supporting-documents/").append(supportingDocumentDirName).append("\n");
        sb.append("./supporting-documents/").append(supportingDocumentDirName).append("/").append(q.getId()).append("\n");
        for (DocumentInstance doc : supportingDocuments.getContent()) {
            sb.append("./supporting-documents/").append(supportingDocumentDirName).append("/").append(q.getId()).append("/")
                    .append(doc.getTitle())
                    .append(" | size=").append(doc.getFileSizeBytes() / 1024).append("KB")
                    .append(" | pages=").append(doc.getNumberOfPages())
                    .append(" | UUID=").append(doc.getId())
                    .append("\n");
        }
        MessageLocalContextDTO localContext = MessageLocalContextDTO.builder()
                .contextType("Supporting Documents")
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

    private static ObjectNode buildResponseSchema(ParameterizedTypeReference typeReference) throws JsonProcessingException {
        String raw = JsonSchemaGenerator.generateForType(typeReference.getType());
        ObjectMapper mapper = new ObjectMapper();
        JsonNode schemaNode = mapper.readTree(raw);
        ObjectNode wrapper = mapper.createObjectNode();
        wrapper.put("name", "json_response_with_actions");
        wrapper.set("schema", schemaNode);
        return wrapper;
    }


    /**
     * Delegates cancellation detection to JobService where the DB read runs
     * in a dedicated transaction.
     */
    private boolean isCancellationRequested(StepExecution stepExecution) {
        return jobService.isDeepThinkingCancellationRequested(stepExecution.getJobExecutionId(), stepExecution.isTerminateOnly());
    }

}

