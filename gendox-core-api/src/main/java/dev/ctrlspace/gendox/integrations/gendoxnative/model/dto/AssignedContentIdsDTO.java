package dev.ctrlspace.gendox.integrations.gendoxnative.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class AssignedContentIdsDTO {
//    private List<ContentIdDTO> posts;
//    private List<ContentIdDTO> products;
//    private List<ContentIdDTO> pages;
    private List<Long> posts;
    private List<Long> products;
    private List<Long> pages;

}
