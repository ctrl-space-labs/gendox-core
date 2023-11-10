package dev.ctrlspace.gendox.etljobs.repositories;

import dev.ctrlspace.gendox.etljobs.model.BatchJobExecution;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BatchJobExecutionRepository extends JpaRepository<BatchJobExecution, Long> {


    @Query("select job " +
            "from BatchJobExecution job " +
            "   join BatchJobInstance instance on job.jobInstanceId = instance.jobInstanceId " +
            "where job.status = :status " +
            "   and instance.jobName = :jobName ")
    List<BatchJobExecution> findJobExecutionByJobNameAndStatus(@Param("jobName") String jobName,
                                                               @Param("status") String status);
}
