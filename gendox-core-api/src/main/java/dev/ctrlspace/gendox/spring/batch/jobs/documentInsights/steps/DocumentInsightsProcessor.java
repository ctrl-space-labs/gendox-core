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


import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;


@Component
@StepScope
public class DocumentInsightsProcessor implements ItemProcessor<TaskDocumentInsightsAnswerDTO, TaskDocumentInsightsAnswersDTO> {

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
    public TaskDocumentInsightsAnswersDTO process(TaskDocumentInsightsAnswerDTO taskDocumentInsightsAnswerDTO) throws Exception {

        List<TaskNewAnswerDTO> newAnswers = new ArrayList<>();
        List<TaskNode> answersToDelete = new ArrayList<>();


        Type nodeTypeAnswer = typeService.getTaskNodeTypeByName(TaskNodeTypeConstants.ANSWER);
        TaskNode taskNode = taskService.getAnswerNodeByDocumentAndQuestion(
                taskDocumentInsightsAnswerDTO.getTaskId(),
                taskDocumentInsightsAnswerDTO.getDocumentNode().getId(),
                taskDocumentInsightsAnswerDTO.getQuestionNode().getId()
        );

        answersToDelete.add(taskNode);


        // Create TaskNodeValueDTO with random message + linking IDs
        TaskNodeValueDTO valueDTO = TaskNodeValueDTO.builder()
                .message(randomSampleMessage())
                .build();

        // Build TaskNodeDTO for the ANSWER node
        TaskNodeDTO answerNodeDTO = TaskNodeDTO.builder()
                .taskId(taskDocumentInsightsAnswerDTO.getTaskId())
                .nodeType(nodeTypeAnswer.getName())
                .nodeValue(valueDTO)
                .build();

        TaskNewAnswerDTO taskNewAnswerDTO = TaskNewAnswerDTO.builder()
                .documentNode(taskDocumentInsightsAnswerDTO.getDocumentNode())
                .questionNode(taskDocumentInsightsAnswerDTO.getQuestionNode())
                .newAnswer(answerNodeDTO)
                .build();

        newAnswers.add(taskNewAnswerDTO);

        TaskDocumentInsightsAnswersDTO taskDocumentInsightsAnswersDTO = TaskDocumentInsightsAnswersDTO.builder()
                .newAnswers(newAnswers)
                .answersToDelete(answersToDelete)
                .build();


        logger.info("Processed TaskDocumentInsightsAnswerDTO: {}",
                taskDocumentInsightsAnswerDTO);

        return taskDocumentInsightsAnswersDTO;
    }


    private String randomSampleMessage() {
        return SAMPLE_MESSAGES[random.nextInt(SAMPLE_MESSAGES.length)];
    }


}

