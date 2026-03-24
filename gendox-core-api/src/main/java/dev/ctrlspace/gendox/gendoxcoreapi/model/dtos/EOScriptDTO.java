package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class EOScriptDTO {
    private UUID id;
    private UUID taskId;
    private String title;
    private String description;
    private String scriptContent;
    private Boolean isLatestVersion;
}
