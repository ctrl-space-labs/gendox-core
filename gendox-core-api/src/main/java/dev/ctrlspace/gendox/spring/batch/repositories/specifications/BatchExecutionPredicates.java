package dev.ctrlspace.gendox.spring.batch.repositories.specifications;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import com.querydsl.core.util.StringUtils;
import com.querydsl.jpa.JPAExpressions;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TimePeriodDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentInstanceSectionCriteria;
import dev.ctrlspace.gendox.spring.batch.model.QBatchJobExecution;
import dev.ctrlspace.gendox.spring.batch.model.QBatchJobInstance;
import dev.ctrlspace.gendox.spring.batch.model.criteria.BatchExecutionCriteria;

import java.util.UUID;

public class BatchExecutionPredicates {

    private static QBatchJobExecution qBatchJobExecution = QBatchJobExecution.batchJobExecution;
    private static QBatchJobInstance qBatchJobInstance = QBatchJobInstance.batchJobInstance;

    public static Predicate build(BatchExecutionCriteria criteria) {
        return ExpressionUtils.allOf(
                jobName(criteria.getJobName()),
                status(criteria.getStatus()),
                exitCode(criteria.getExitCode())
        );
    }

    private static Predicate status(String status) {
        if (StringUtils.isNullOrEmpty(status)) {
            return null;
        }
        return qBatchJobExecution.status.eq(status);
    }

    private static Predicate jobName(String jobName) {
        if (StringUtils.isNullOrEmpty(jobName)) {
            return null;
        }

        return qBatchJobExecution.jobInstanceId.in(
                JPAExpressions
                        .select(qBatchJobInstance.jobInstanceId)
                        .from(qBatchJobInstance)
                        .where(qBatchJobInstance.jobInstanceId.eq(qBatchJobExecution.jobInstanceId)
                                .and(qBatchJobInstance.jobName.eq(jobName))));
    }

    private static Predicate exitCode(String exitCode) {
        if (StringUtils.isNullOrEmpty(exitCode)) {
            return null;
        }
        return qBatchJobExecution.exitCode.eq(exitCode);
    }
}




