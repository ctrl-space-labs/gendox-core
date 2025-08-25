package dev.ctrlspace.gendox.spring.batch.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchJobExecutionParamsId implements Serializable {
    @Column(name = "job_execution_id", nullable = false)
    private Long jobExecutionId;

    @Column(name = "parameter_name", nullable = false, length = 100)
    private String parameterName;

    @Column(name = "parameter_type", nullable = false, length = 100)
    private String parameterType;
}
