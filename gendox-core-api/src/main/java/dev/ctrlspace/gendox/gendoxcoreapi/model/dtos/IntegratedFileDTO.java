package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import dev.ctrlspace.gendox.gendoxcoreapi.model.TempIntegrationFileCheck;
import dev.ctrlspace.gendox.integrations.gendoxnative.model.dto.ContentIdDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class IntegratedFileDTO {
    private MultipartFile multipartFile;
    private TempIntegrationFileCheck externalFile;

}
