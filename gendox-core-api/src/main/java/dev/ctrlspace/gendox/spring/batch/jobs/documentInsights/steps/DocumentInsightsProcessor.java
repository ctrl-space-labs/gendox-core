package dev.ctrlspace.gendox.spring.batch.jobs.documentInsights.steps;


import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TaskDocumentInsightsDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TaskNodeDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TypeService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskNodeTypeConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TaskNodeValueDTO;


import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;


@Component
@StepScope
public class DocumentInsightsProcessor implements ItemProcessor<TaskDocumentInsightsDTO, List<TaskNodeDTO>> {

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
    public List<TaskNodeDTO> process(TaskDocumentInsightsDTO taskDocumentInsightsDTO) throws Exception {
        List<TaskNodeDTO> answerTaskNodeDTOs = new ArrayList<>();
        List<UUID> previousAnswerToDelete = taskService.deleteAnswerEdgesByTaskDocumentInsights(taskDocumentInsightsDTO);
        taskService.deleteTaskNodesByIds(previousAnswerToDelete);

        Type nodeTypeAnswer = typeService.getTaskNodeTypeByName(TaskNodeTypeConstants.ANSWER);


        // For each document node
        for (TaskNode documentNode : taskDocumentInsightsDTO.getDocumentNodes()) {
            // For each question node
            for (TaskNode questionNode : taskDocumentInsightsDTO.getQuestionNodes()) {

                // Create TaskNodeValueDTO with random message + linking IDs
                TaskNodeValueDTO valueDTO = TaskNodeValueDTO.builder()
                        .message(randomSampleMessage())
                        .questionNodeId(questionNode.getId().toString())
                        .documentNodeId(documentNode.getId().toString())
                        .build();

                // Build TaskNodeDTO for the ANSWER node
                TaskNodeDTO answerNodeDTO = TaskNodeDTO.builder()
                        .taskId(taskDocumentInsightsDTO.getTaskId())
                        .nodeType(nodeTypeAnswer.getName())
                        .nodeValue(valueDTO)
                        .build();

                answerTaskNodeDTOs.add(answerNodeDTO);
            }
        }

        logger.info("Processed {} document nodes and {} question nodes to create {} answer nodes.",
                taskDocumentInsightsDTO.getDocumentNodes().size(),
                taskDocumentInsightsDTO.getQuestionNodes().size(),
                answerTaskNodeDTOs.size());

        return answerTaskNodeDTOs;
    }


    private String randomSampleMessage() {
        return SAMPLE_MESSAGES[random.nextInt(SAMPLE_MESSAGES.length)];
    }


}

