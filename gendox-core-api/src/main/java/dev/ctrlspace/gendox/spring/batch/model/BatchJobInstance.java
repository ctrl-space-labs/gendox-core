package dev.ctrlspace.gendox.spring.batch.model;

import jakarta.persistence.*;

@Entity
@Table(name = "batch_job_instance", schema = "gendox_jobs")
public class BatchJobInstance {
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    @Column(name = "job_instance_id", nullable = false)
    private Long jobInstanceId;
    @Basic
    @Column(name = "version", nullable = true)
    private Long version;
    @Basic
    @Column(name = "job_name", nullable = false, length = 100)
    private String jobName;
    @Basic
    @Column(name = "job_key", nullable = false, length = 32)
    private String jobKey;

    public Long getJobInstanceId() {
        return jobInstanceId;
    }

    public void setJobInstanceId(Long jobInstanceId) {
        this.jobInstanceId = jobInstanceId;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    public String getJobName() {
        return jobName;
    }

    public void setJobName(String jobName) {
        this.jobName = jobName;
    }

    public String getJobKey() {
        return jobKey;
    }

    public void setJobKey(String jobKey) {
        this.jobKey = jobKey;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        BatchJobInstance that = (BatchJobInstance) o;

        if (jobInstanceId != null ? !jobInstanceId.equals(that.jobInstanceId) : that.jobInstanceId != null)
            return false;
        if (version != null ? !version.equals(that.version) : that.version != null) return false;
        if (jobName != null ? !jobName.equals(that.jobName) : that.jobName != null) return false;
        if (jobKey != null ? !jobKey.equals(that.jobKey) : that.jobKey != null) return false;

        return true;
    }

    @Override
    public int hashCode() {
        int result = jobInstanceId != null ? jobInstanceId.hashCode() : 0;
        result = 31 * result + (version != null ? version.hashCode() : 0);
        result = 31 * result + (jobName != null ? jobName.hashCode() : 0);
        result = 31 * result + (jobKey != null ? jobKey.hashCode() : 0);
        return result;
    }
}
