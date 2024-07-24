package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class SearchResult {

    private String documentSectionId;
    private String documentId;
    private String iscc;
    private String title;
    private String text;
    private String documentURL; // get document or document section by ID
    private String tokens;
    private String ownerName; // get public info of organization by ID
    private Object signedPermissionOfUseVc;

}