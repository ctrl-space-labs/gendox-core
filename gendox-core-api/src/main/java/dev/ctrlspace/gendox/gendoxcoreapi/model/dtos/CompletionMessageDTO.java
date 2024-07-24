package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class CompletionMessageDTO {
    private Message message;
    private List<UUID> sectionId;
    private UUID threadID;
    private List<String> iscc;
    private List<String> title;
    private List<String> documentURL; // get document or document section by ID
    private List<Double> tokens;
    private List<String> ownerName; // get public info of organization by ID
    private List<Object> signedPermissionOfUseVc;
    private List<String> aiModelName;

    // TODO review this to add more metadata about the sections involved in the response

}
