package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class WebScrapePageCriteria {
    private String integrationId;
    private String status;
    private Boolean isSelected;
}
