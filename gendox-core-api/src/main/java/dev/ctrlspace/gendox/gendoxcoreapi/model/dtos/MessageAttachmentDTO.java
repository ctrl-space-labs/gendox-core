package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class MessageAttachmentDTO {
    private UUID documentId;
    private String title;
    private String remoteUrl;
    private String externalUrl;
    private Long fileSizeBytes;
    private Object fileType;
}



