package dev.ctrlspace.gendox.spring.batch.model;

import jakarta.persistence.*;

@IdClass(BatchJobExecutionParamsId.class)
@Entity
@Table(name = "batch_job_execution_params", schema = "gendox_jobs")
public class BatchJobExecutionParams {
    @Id
    @Column(name = "job_execution_id", nullable = false)
    private Long jobExecutionId;
    @Id
    @Column(name = "parameter_name", nullable = false, length = 100)
    private String parameterName;
    @Id
    @Column(name = "parameter_type", nullable = false, length = 100)
    private String parameterType;
    @Basic
    @Column(name = "parameter_value", nullable = true, length = 2500)
    private String parameterValue;
    @Basic
    @Column(name = "identifying", nullable = false, length = -1)
    private String identifying;

    @ManyToOne
    @JoinColumn(name = "job_execution_id", referencedColumnName = "job_execution_id", insertable=false, updatable=false)
    private BatchJobExecution batchJobExecution;

    public Long getJobExecutionId() {
        return jobExecutionId;
    }

    public void setJobExecutionId(Long jobExecutionId) {
        this.jobExecutionId = jobExecutionId;
    }

    public String getParameterName() {
        return parameterName;
    }

    public void setParameterName(String parameterName) {
        this.parameterName = parameterName;
    }

    public String getParameterType() {
        return parameterType;
    }

    public void setParameterType(String parameterType) {
        this.parameterType = parameterType;
    }

    public String getParameterValue() {
        return parameterValue;
    }

    public void setParameterValue(String parameterValue) {
        this.parameterValue = parameterValue;
    }

    public String getIdentifying() {
        return identifying;
    }

    public void setIdentifying(String identifying) {
        this.identifying = identifying;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        BatchJobExecutionParams that = (BatchJobExecutionParams) o;

        if (jobExecutionId != null ? !jobExecutionId.equals(that.jobExecutionId) : that.jobExecutionId != null)
            return false;
        if (parameterName != null ? !parameterName.equals(that.parameterName) : that.parameterName != null)
            return false;
        if (parameterType != null ? !parameterType.equals(that.parameterType) : that.parameterType != null)
            return false;
        if (parameterValue != null ? !parameterValue.equals(that.parameterValue) : that.parameterValue != null)
            return false;
        if (identifying != null ? !identifying.equals(that.identifying) : that.identifying != null) return false;

        return true;
    }

    @Override
    public int hashCode() {
        int result = jobExecutionId != null ? jobExecutionId.hashCode() : 0;
        result = 31 * result + (parameterName != null ? parameterName.hashCode() : 0);
        result = 31 * result + (parameterType != null ? parameterType.hashCode() : 0);
        result = 31 * result + (parameterValue != null ? parameterValue.hashCode() : 0);
        result = 31 * result + (identifying != null ? identifying.hashCode() : 0);
        return result;
    }
}
