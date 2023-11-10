package dev.ctrlspace.gendox.etljobs.model;

import jakarta.persistence.*;

@Entity
@Table(name = "batch_job_execution_context", schema = "gendox_jobs")
public class BatchJobExecutionContext {
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    @Column(name = "job_execution_id", nullable = false)
    private Long jobExecutionId;
    @Basic
    @Column(name = "short_context", nullable = false, length = 2500)
    private String shortContext;
    @Basic
    @Column(name = "serialized_context", nullable = true, length = -1)
    private String serializedContext;

    public Long getJobExecutionId() {
        return jobExecutionId;
    }

    public void setJobExecutionId(Long jobExecutionId) {
        this.jobExecutionId = jobExecutionId;
    }

    public String getShortContext() {
        return shortContext;
    }

    public void setShortContext(String shortContext) {
        this.shortContext = shortContext;
    }

    public String getSerializedContext() {
        return serializedContext;
    }

    public void setSerializedContext(String serializedContext) {
        this.serializedContext = serializedContext;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        BatchJobExecutionContext that = (BatchJobExecutionContext) o;

        if (jobExecutionId != null ? !jobExecutionId.equals(that.jobExecutionId) : that.jobExecutionId != null)
            return false;
        if (shortContext != null ? !shortContext.equals(that.shortContext) : that.shortContext != null) return false;
        if (serializedContext != null ? !serializedContext.equals(that.serializedContext) : that.serializedContext != null)
            return false;

        return true;
    }

    @Override
    public int hashCode() {
        int result = jobExecutionId != null ? jobExecutionId.hashCode() : 0;
        result = 31 * result + (shortContext != null ? shortContext.hashCode() : 0);
        result = 31 * result + (serializedContext != null ? serializedContext.hashCode() : 0);
        return result;
    }
}
