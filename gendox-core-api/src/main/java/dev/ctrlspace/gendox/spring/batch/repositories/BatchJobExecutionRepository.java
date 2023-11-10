package dev.ctrlspace.gendox.spring.batch.repositories;

import com.querydsl.core.types.Predicate;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.spring.batch.model.BatchJobExecution;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BatchJobExecutionRepository extends JpaRepository<BatchJobExecution, Long>, QuerydslPredicateExecutor<BatchJobExecution> {

    Page<BatchJobExecution> findAll(Predicate predicate, Pageable pageable);

    @Query("select job " +
            "from BatchJobExecution job " +
            "   join BatchJobInstance instance on job.jobInstanceId = instance.jobInstanceId " +
            "where job.status = :status " +
            "   and instance.jobName = :jobName ")
    List<BatchJobExecution> findJobExecutionByJobNameAndStatus(@Param("jobName") String jobName,
                                                               @Param("status") String status);
}
