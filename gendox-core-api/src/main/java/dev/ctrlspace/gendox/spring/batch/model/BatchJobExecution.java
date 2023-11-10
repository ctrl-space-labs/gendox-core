package dev.ctrlspace.gendox.spring.batch.model;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "batch_job_execution", schema = "gendox_jobs")
public class BatchJobExecution {
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    @Column(name = "job_execution_id", nullable = false)
    private Long jobExecutionId;
    @Basic
    @Column(name = "version", nullable = true)
    private Long version;
    @Basic
    @Column(name = "job_instance_id", nullable = false)
    private Long jobInstanceId;
    @Basic
    @Column(name = "create_time", nullable = false)
    private Instant createTime;
    @Basic
    @Column(name = "start_time", nullable = true)
    private Instant startTime;
    @Basic
    @Column(name = "end_time", nullable = true)
    private Instant endTime;
    @Basic
    @Column(name = "status", nullable = true, length = 10)
    private String status;
    @Basic
    @Column(name = "exit_code", nullable = true, length = 2500)
    private String exitCode;
    @Basic
    @Column(name = "exit_message", nullable = true, length = 2500)
    private String exitMessage;
    @Basic
    @Column(name = "last_updated", nullable = true)
    private Instant lastUpdated;

    @OneToMany(mappedBy = "batchJobExecution")
    private List<BatchJobExecutionParams> batchJobExecutionParams;

    public Long getJobExecutionId() {
        return jobExecutionId;
    }

    public void setJobExecutionId(Long jobExecutionId) {
        this.jobExecutionId = jobExecutionId;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    public Long getJobInstanceId() {
        return jobInstanceId;
    }

    public void setJobInstanceId(Long jobInstanceId) {
        this.jobInstanceId = jobInstanceId;
    }

    public Instant getCreateTime() {
        return createTime;
    }

    public void setCreateTime(Instant createTime) {
        this.createTime = createTime;
    }

    public Instant getStartTime() {
        return startTime;
    }

    public void setStartTime(Instant startTime) {
        this.startTime = startTime;
    }

    public Instant getEndTime() {
        return endTime;
    }

    public void setEndTime(Instant endTime) {
        this.endTime = endTime;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getExitCode() {
        return exitCode;
    }

    public void setExitCode(String exitCode) {
        this.exitCode = exitCode;
    }

    public String getExitMessage() {
        return exitMessage;
    }

    public void setExitMessage(String exitMessage) {
        this.exitMessage = exitMessage;
    }

    public Instant getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(Instant lastUpdated) {
        this.lastUpdated = lastUpdated;
    }

    public List<BatchJobExecutionParams> getBatchJobExecutionParams() {
        return batchJobExecutionParams;
    }

    public void setBatchJobExecutionParams(List<BatchJobExecutionParams> batchJobExecutionParams) {
        this.batchJobExecutionParams = batchJobExecutionParams;
    }


    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        BatchJobExecution that = (BatchJobExecution) o;

        if (!Objects.equals(jobExecutionId, that.jobExecutionId))
            return false;
        if (!Objects.equals(version, that.version)) return false;
        if (!Objects.equals(jobInstanceId, that.jobInstanceId))
            return false;
        if (!Objects.equals(createTime, that.createTime)) return false;
        if (!Objects.equals(startTime, that.startTime)) return false;
        if (!Objects.equals(endTime, that.endTime)) return false;
        if (!Objects.equals(status, that.status)) return false;
        if (!Objects.equals(exitCode, that.exitCode)) return false;
        if (!Objects.equals(exitMessage, that.exitMessage)) return false;
        if (!Objects.equals(lastUpdated, that.lastUpdated)) return false;
        return Objects.equals(batchJobExecutionParams, that.batchJobExecutionParams);
    }

    @Override
    public int hashCode() {
        int result = jobExecutionId != null ? jobExecutionId.hashCode() : 0;
        result = 31 * result + (version != null ? version.hashCode() : 0);
        result = 31 * result + (jobInstanceId != null ? jobInstanceId.hashCode() : 0);
        result = 31 * result + (createTime != null ? createTime.hashCode() : 0);
        result = 31 * result + (startTime != null ? startTime.hashCode() : 0);
        result = 31 * result + (endTime != null ? endTime.hashCode() : 0);
        result = 31 * result + (status != null ? status.hashCode() : 0);
        result = 31 * result + (exitCode != null ? exitCode.hashCode() : 0);
        result = 31 * result + (exitMessage != null ? exitMessage.hashCode() : 0);
        result = 31 * result + (lastUpdated != null ? lastUpdated.hashCode() : 0);
        result = 31 * result + (batchJobExecutionParams != null ? batchJobExecutionParams.hashCode() : 0);
        return result;
    }
}
