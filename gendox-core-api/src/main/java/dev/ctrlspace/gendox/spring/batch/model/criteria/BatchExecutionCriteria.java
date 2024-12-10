package dev.ctrlspace.gendox.spring.batch.model.criteria;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class BatchExecutionCriteria {

    private String jobName;
    private String status;
    private String exitCode;
}
