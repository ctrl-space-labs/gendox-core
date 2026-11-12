package dev.ctrlspace.gendox.spring.batch.model.criteria;

import com.fasterxml.jackson.annotation.JsonCreator;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor(onConstructor_ = @JsonCreator)
@Builder(toBuilder = true)
public class BatchExecutionCriteria {

    private String jobName;
    private String status;
    private String exitCode;
    private List<Long> jobExecutionIdsIn;
    @Builder.Default
    private List<BatchExecutionParamCriteria> matchAllParams = new ArrayList<>(); // Parameters that must match all criteria

}
