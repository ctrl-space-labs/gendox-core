package dev.ctrlspace.gendox.spring.batch.model.criteria;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class BatchExecutionCriteria {

    private String jobName;
    private String status;
    private String exitCode;
    @Builder.Default
    private List<BatchExecutionParamCriteria> matchAllParams = new ArrayList<>(); // Parameters that must match all criteria

}
