package dev.ctrlspace.gendox.spring.batch.repositories;

import dev.ctrlspace.gendox.spring.batch.model.BatchJobExecution;
import dev.ctrlspace.gendox.spring.batch.model.BatchJobExecutionParams;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BatchJobExecutionParamsRepository extends JpaRepository<BatchJobExecutionParams, Long> {


    @Query("select params " +
            "from BatchJobExecutionParams params " +
            "where params.jobExecutionId = :executionId " +
            "   and params.parameterName = :name ")
    BatchJobExecutionParams findByExecutionIdAndName(@Param("executionId") Long executionId, @Param("name") String name);
}
