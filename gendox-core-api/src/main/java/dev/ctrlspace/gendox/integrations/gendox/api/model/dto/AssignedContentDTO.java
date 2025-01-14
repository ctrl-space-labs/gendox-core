package dev.ctrlspace.gendox.integrations.gendox.api.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class AssignedContentDTO {
    private Long contentId;
    private String title;
    private String type;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;

    // this are populated later, they are not comming from the API
    // TODO think if these need to be an other object
    private String externalUrl;
    private String remoteUrl;
    private UUID projectID;
    private UUID integrationId;
    private String fileType;

}
