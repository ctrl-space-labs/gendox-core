package dev.ctrlspace.gendox.spring.batch.repositories;

import com.querydsl.core.types.Predicate;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.spring.batch.model.BatchJobExecution;
import dev.ctrlspace.gendox.spring.batch.utils.JobExecutionParamConstants;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface BatchJobExecutionRepository extends JpaRepository<BatchJobExecution, Long>, QuerydslPredicateExecutor<BatchJobExecution>, BatchJobExecutionRepositoryCustom
{

    @EntityGraph(attributePaths = "batchJobExecutionParams")
    List<BatchJobExecution> findByJobExecutionIdIn(Collection<Long> ids);

    @Query("select job " +
            "from BatchJobExecution job " +
            "   join BatchJobInstance instance on job.jobInstanceId = instance.jobInstanceId " +
            "where job.status = :status " +
            "   and instance.jobName = :jobName ")
    List<BatchJobExecution> findJobExecutionByJobNameAndStatus(@Param("jobName") String jobName,
                                                               @Param("status") String status);

    /**
     * Finds job executions by job name, status, and a specific project ID parameter.
     * This is mainly used to see if the same job is already running.
     * The projectId param can be a specific project, or "ALL_PROJECTS" to match all projects. In any case, this is finding this job.
     *
     * @param jobName
     * @param status
     * @param projectIdParam
     * @return
     */
    @Query("select job " +
            "from BatchJobExecution job " +
            "   join BatchJobInstance instance on job.jobInstanceId = instance.jobInstanceId " +
            "   join BatchJobExecutionParams projectParams on projectParams.jobExecutionId = job.jobExecutionId " +
            "where job.status = :status " +
            "   and instance.jobName = :jobName " +
            "   and projectParams.parameterName = '"+ JobExecutionParamConstants.PROJECT_ID + "' " +
            "   and projectParams.parameterValue = :projectIdParam" )
    List<BatchJobExecution> findJobExecutionByJobNameAndStatusAndProjectParam(@Param("jobName") String jobName,
                                                                        @Param("status") String status,
                                                                        @Param("projectIdParam") String projectIdParam);


}
