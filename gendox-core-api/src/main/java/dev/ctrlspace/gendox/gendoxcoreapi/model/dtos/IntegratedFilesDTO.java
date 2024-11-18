package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import dev.ctrlspace.gendox.integrations.gendoxnative.model.dto.ContentDTO;
import dev.ctrlspace.gendox.integrations.gendoxnative.model.dto.ContentIdDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class IntegratedFilesDTO {
    private List<MultipartFile> multipartFiles;
    private Map<String, List<ContentIdDTO>> contentIdDTOLists;

}
