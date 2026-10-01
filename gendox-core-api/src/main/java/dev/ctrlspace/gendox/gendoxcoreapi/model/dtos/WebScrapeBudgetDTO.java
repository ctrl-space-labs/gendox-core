package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * What a plan allows in a billing period, what has been spent against it, and
 * what is left. A null limit means the budget is not being enforced, which is
 * not the same as a limit of zero, so the two cannot share a representation.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class WebScrapeBudgetDTO {
    private Integer maxPages;
    private Integer usedPages;
    private Integer remainingPages;
    private TimePeriodDTO period;
}
