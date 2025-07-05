package dev.ctrlspace.gendox.spring.batch.jobs.documentInsights.steps;


import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.*;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TypeService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskNodeTypeConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;


import java.util.*;


@Component
@StepScope
public class DocumentInsightsProcessor implements ItemProcessor<TaskDocumentQuestionPairDTO, TaskAnswerBatchDTO> {

    private static final Logger logger = LoggerFactory.getLogger(DocumentInsightsProcessor.class);

    // Sample messages from ChatGPT for demo
    private final Random random = new Random();
    private static final String[] SAMPLE_MESSAGES = {
            "This is a response from ChatGPT.",
            "Here's a helpful answer for your question.",
            "Processing complete, here is the generated insight.",
            "AI-generated response for the task node.",
            "Answer created by DocumentInsightsProcessor."
    };

    private TypeService typeService;
    private TaskService taskService;

    @Autowired
    public DocumentInsightsProcessor(TypeService typeService,
                                     TaskService taskService) {
        this.typeService = typeService;
        this.taskService = taskService;
    }

    @Override
    public TaskAnswerBatchDTO process(TaskDocumentQuestionPairDTO taskDocumentQuestionPairDTO) throws Exception {

        List<AnswerCreationDTO> newAnswers = new ArrayList<>();
        List<TaskNode> answersToDelete = new ArrayList<>();


        Type nodeTypeAnswer = typeService.getTaskNodeTypeByName(TaskNodeTypeConstants.ANSWER);


        Optional<TaskNode> taskNodeOpt = taskService.findAnswerNodeByDocumentAndQuestionOptional(
                taskDocumentQuestionPairDTO.getTaskId(),
                taskDocumentQuestionPairDTO.getDocumentNode().getId(),
                taskDocumentQuestionPairDTO.getQuestionNode().getId()
        );

        taskNodeOpt.ifPresent(answersToDelete::add);


        // Create TaskNodeValueDTO with random message + linking IDs
        TaskNodeValueDTO valueDTO = TaskNodeValueDTO.builder()
                .message(randomSampleMessage())
                .build();

        // Build TaskNodeDTO for the ANSWER node
        TaskNodeDTO answerNodeDTO = TaskNodeDTO.builder()
                .taskId(taskDocumentQuestionPairDTO.getTaskId())
                .nodeType(nodeTypeAnswer.getName())
                .nodeValue(valueDTO)
                .build();

        AnswerCreationDTO answerCreationDTO = AnswerCreationDTO.builder()
                .documentNode(taskDocumentQuestionPairDTO.getDocumentNode())
                .questionNode(taskDocumentQuestionPairDTO.getQuestionNode())
                .newAnswer(answerNodeDTO)
                .build();

        newAnswers.add(answerCreationDTO);

        TaskAnswerBatchDTO taskAnswerBatchDTO = TaskAnswerBatchDTO.builder()
                .newAnswers(newAnswers)
                .answersToDelete(answersToDelete)
                .build();


        logger.info("Processed TaskDocumentInsightsAnswerDTO: {}",
                taskDocumentQuestionPairDTO);

        return taskAnswerBatchDTO;
    }


    private String randomSampleMessage() {
        return SAMPLE_MESSAGES[random.nextInt(SAMPLE_MESSAGES.length)];
    }


}

