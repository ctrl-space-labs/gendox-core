package dev.ctrlspace.gendox.spring.batch.model;

import jakarta.persistence.*;

import java.sql.Timestamp;

@Entity
@Table(name = "batch_step_execution", schema = "gendox_jobs")
public class BatchStepExecution {
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    @Column(name = "step_execution_id", nullable = false)
    private Long stepExecutionId;
    @Basic
    @Column(name = "version", nullable = false)
    private Long version;
    @Basic
    @Column(name = "step_name", nullable = false, length = 100)
    private String stepName;
    @Basic
    @Column(name = "job_execution_id", nullable = false)
    private Long jobExecutionId;
    @Basic
    @Column(name = "create_time", nullable = false)
    private Timestamp createTime;
    @Basic
    @Column(name = "start_time", nullable = true)
    private Timestamp startTime;
    @Basic
    @Column(name = "end_time", nullable = true)
    private Timestamp endTime;
    @Basic
    @Column(name = "status", nullable = true, length = 10)
    private String status;
    @Basic
    @Column(name = "commit_count", nullable = true)
    private Long commitCount;
    @Basic
    @Column(name = "read_count", nullable = true)
    private Long readCount;
    @Basic
    @Column(name = "filter_count", nullable = true)
    private Long filterCount;
    @Basic
    @Column(name = "write_count", nullable = true)
    private Long writeCount;
    @Basic
    @Column(name = "read_skip_count", nullable = true)
    private Long readSkipCount;
    @Basic
    @Column(name = "write_skip_count", nullable = true)
    private Long writeSkipCount;
    @Basic
    @Column(name = "process_skip_count", nullable = true)
    private Long processSkipCount;
    @Basic
    @Column(name = "rollback_count", nullable = true)
    private Long rollbackCount;
    @Basic
    @Column(name = "exit_code", nullable = true, length = 2500)
    private String exitCode;
    @Basic
    @Column(name = "exit_message", nullable = true, length = 2500)
    private String exitMessage;
    @Basic
    @Column(name = "last_updated", nullable = true)
    private Timestamp lastUpdated;

    public Long getStepExecutionId() {
        return stepExecutionId;
    }

    public void setStepExecutionId(Long stepExecutionId) {
        this.stepExecutionId = stepExecutionId;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    public String getStepName() {
        return stepName;
    }

    public void setStepName(String stepName) {
        this.stepName = stepName;
    }

    public Long getJobExecutionId() {
        return jobExecutionId;
    }

    public void setJobExecutionId(Long jobExecutionId) {
        this.jobExecutionId = jobExecutionId;
    }

    public Timestamp getCreateTime() {
        return createTime;
    }

    public void setCreateTime(Timestamp createTime) {
        this.createTime = createTime;
    }

    public Timestamp getStartTime() {
        return startTime;
    }

    public void setStartTime(Timestamp startTime) {
        this.startTime = startTime;
    }

    public Timestamp getEndTime() {
        return endTime;
    }

    public void setEndTime(Timestamp endTime) {
        this.endTime = endTime;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getCommitCount() {
        return commitCount;
    }

    public void setCommitCount(Long commitCount) {
        this.commitCount = commitCount;
    }

    public Long getReadCount() {
        return readCount;
    }

    public void setReadCount(Long readCount) {
        this.readCount = readCount;
    }

    public Long getFilterCount() {
        return filterCount;
    }

    public void setFilterCount(Long filterCount) {
        this.filterCount = filterCount;
    }

    public Long getWriteCount() {
        return writeCount;
    }

    public void setWriteCount(Long writeCount) {
        this.writeCount = writeCount;
    }

    public Long getReadSkipCount() {
        return readSkipCount;
    }

    public void setReadSkipCount(Long readSkipCount) {
        this.readSkipCount = readSkipCount;
    }

    public Long getWriteSkipCount() {
        return writeSkipCount;
    }

    public void setWriteSkipCount(Long writeSkipCount) {
        this.writeSkipCount = writeSkipCount;
    }

    public Long getProcessSkipCount() {
        return processSkipCount;
    }

    public void setProcessSkipCount(Long processSkipCount) {
        this.processSkipCount = processSkipCount;
    }

    public Long getRollbackCount() {
        return rollbackCount;
    }

    public void setRollbackCount(Long rollbackCount) {
        this.rollbackCount = rollbackCount;
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

    public Timestamp getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(Timestamp lastUpdated) {
        this.lastUpdated = lastUpdated;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        BatchStepExecution that = (BatchStepExecution) o;

        if (stepExecutionId != null ? !stepExecutionId.equals(that.stepExecutionId) : that.stepExecutionId != null)
            return false;
        if (version != null ? !version.equals(that.version) : that.version != null) return false;
        if (stepName != null ? !stepName.equals(that.stepName) : that.stepName != null) return false;
        if (jobExecutionId != null ? !jobExecutionId.equals(that.jobExecutionId) : that.jobExecutionId != null)
            return false;
        if (createTime != null ? !createTime.equals(that.createTime) : that.createTime != null) return false;
        if (startTime != null ? !startTime.equals(that.startTime) : that.startTime != null) return false;
        if (endTime != null ? !endTime.equals(that.endTime) : that.endTime != null) return false;
        if (status != null ? !status.equals(that.status) : that.status != null) return false;
        if (commitCount != null ? !commitCount.equals(that.commitCount) : that.commitCount != null) return false;
        if (readCount != null ? !readCount.equals(that.readCount) : that.readCount != null) return false;
        if (filterCount != null ? !filterCount.equals(that.filterCount) : that.filterCount != null) return false;
        if (writeCount != null ? !writeCount.equals(that.writeCount) : that.writeCount != null) return false;
        if (readSkipCount != null ? !readSkipCount.equals(that.readSkipCount) : that.readSkipCount != null)
            return false;
        if (writeSkipCount != null ? !writeSkipCount.equals(that.writeSkipCount) : that.writeSkipCount != null)
            return false;
        if (processSkipCount != null ? !processSkipCount.equals(that.processSkipCount) : that.processSkipCount != null)
            return false;
        if (rollbackCount != null ? !rollbackCount.equals(that.rollbackCount) : that.rollbackCount != null)
            return false;
        if (exitCode != null ? !exitCode.equals(that.exitCode) : that.exitCode != null) return false;
        if (exitMessage != null ? !exitMessage.equals(that.exitMessage) : that.exitMessage != null) return false;
        if (lastUpdated != null ? !lastUpdated.equals(that.lastUpdated) : that.lastUpdated != null) return false;

        return true;
    }

    @Override
    public int hashCode() {
        int result = stepExecutionId != null ? stepExecutionId.hashCode() : 0;
        result = 31 * result + (version != null ? version.hashCode() : 0);
        result = 31 * result + (stepName != null ? stepName.hashCode() : 0);
        result = 31 * result + (jobExecutionId != null ? jobExecutionId.hashCode() : 0);
        result = 31 * result + (createTime != null ? createTime.hashCode() : 0);
        result = 31 * result + (startTime != null ? startTime.hashCode() : 0);
        result = 31 * result + (endTime != null ? endTime.hashCode() : 0);
        result = 31 * result + (status != null ? status.hashCode() : 0);
        result = 31 * result + (commitCount != null ? commitCount.hashCode() : 0);
        result = 31 * result + (readCount != null ? readCount.hashCode() : 0);
        result = 31 * result + (filterCount != null ? filterCount.hashCode() : 0);
        result = 31 * result + (writeCount != null ? writeCount.hashCode() : 0);
        result = 31 * result + (readSkipCount != null ? readSkipCount.hashCode() : 0);
        result = 31 * result + (writeSkipCount != null ? writeSkipCount.hashCode() : 0);
        result = 31 * result + (processSkipCount != null ? processSkipCount.hashCode() : 0);
        result = 31 * result + (rollbackCount != null ? rollbackCount.hashCode() : 0);
        result = 31 * result + (exitCode != null ? exitCode.hashCode() : 0);
        result = 31 * result + (exitMessage != null ? exitMessage.hashCode() : 0);
        result = 31 * result + (lastUpdated != null ? lastUpdated.hashCode() : 0);
        return result;
    }
}
