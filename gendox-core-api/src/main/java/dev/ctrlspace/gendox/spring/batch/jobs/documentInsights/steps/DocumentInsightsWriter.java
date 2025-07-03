package dev.ctrlspace.gendox.spring.batch.jobs.documentInsights.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.TaskNodeConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskEdge;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TaskDocumentInsightsDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TaskNodeDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TaskNodeRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.item.Chunk;
import org.springframework.batch.item.ItemWriter;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class DocumentInsightsWriter implements ItemWriter<List<TaskNodeDTO>> {

    private static final Logger logger = LoggerFactory.getLogger(DocumentInsightsWriter.class);

    private final TaskNodeRepository taskNodeRepository;
    private final TaskNodeConverter taskNodeConverter;
    private final TaskService taskService;

    public DocumentInsightsWriter(TaskNodeRepository taskNodeRepository,
                                  TaskNodeConverter taskNodeConverter,
                                  TaskService taskService) {
        this.taskNodeRepository = taskNodeRepository;
        this.taskNodeConverter = taskNodeConverter;
        this.taskService = taskService;
    }


    @Override
    public void write(Chunk<? extends List<TaskNodeDTO>> taskNodeDTOChunk) throws Exception {
        List<TaskNodeDTO> allAnswerNodeDtos = new ArrayList<>();
        for (List<TaskNodeDTO> dtoList : taskNodeDTOChunk) {
            for (TaskNodeDTO dto : dtoList) {
                allAnswerNodeDtos.add(dto);
            }
        }
        List<TaskNode> answerNodesToSave = new ArrayList<>();
        for (TaskNodeDTO dto : allAnswerNodeDtos) {
            TaskNode entity = taskNodeConverter.toEntity(dto);
            answerNodesToSave.add(entity);
        }
        List<TaskNode> savedNodes = taskNodeRepository.saveAll(answerNodesToSave);
        logger.info("Saved {} answer nodes for document insights", savedNodes.size());
        List<TaskEdge> asnwerEdges = taskService.createAnswerEdges(savedNodes);
        logger.info("Created {} answer edges for document insights", asnwerEdges.size());
    }


}

