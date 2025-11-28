package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs;

import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.minidev.json.annotate.JsonIgnore;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class TaskDTO {
    private UUID id;
    private UUID projectId;
    private String type;
    private String title;
    private String description;
    private AiModel completionModel;
    private String taskPrompt;
    private Long maxToken;
    private Double temperature;
    private Double topP;


}
