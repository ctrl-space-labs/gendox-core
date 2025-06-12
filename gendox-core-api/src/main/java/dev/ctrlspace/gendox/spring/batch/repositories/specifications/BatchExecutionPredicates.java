package dev.ctrlspace.gendox.spring.batch.repositories.specifications;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import com.querydsl.core.util.StringUtils;
import com.querydsl.jpa.JPAExpressions;
import dev.ctrlspace.gendox.spring.batch.model.QBatchJobExecution;
import dev.ctrlspace.gendox.spring.batch.model.QBatchJobInstance;
import dev.ctrlspace.gendox.spring.batch.model.criteria.BatchExecutionCriteria;
import dev.ctrlspace.gendox.spring.batch.model.criteria.ParamCriteria;

import java.util.List;

public class BatchExecutionPredicates {

    private static QBatchJobExecution qBatchJobExecution = QBatchJobExecution.batchJobExecution;
    private static QBatchJobInstance qBatchJobInstance = QBatchJobInstance.batchJobInstance;


    public static Predicate build(BatchExecutionCriteria criteria) {
        return ExpressionUtils.allOf(
                jobName(criteria.getJobName()),
                status(criteria.getStatus()),
                exitCode(criteria.getExitCode()),
                allParams(criteria.getMatchAllParams())
        );
    }

    private static Predicate allParams(List<ParamCriteria> matchAllParams) {

        if (matchAllParams == null || matchAllParams.isEmpty()) {
            return null;
        }

        Predicate[] predicates = matchAllParams.stream()
                .map(param -> {
                    if (param.getParamValue() == null) {
                        // projectId = null -> parameterValue IS NULL
                        return qBatchJobExecution.batchJobExecutionParams.any().parameterName.eq(param.getParamName())
                                .and(qBatchJobExecution.batchJobExecutionParams.any().parameterValue.isNull());
                    } else {
                        return qBatchJobExecution.batchJobExecutionParams.any().parameterName.eq(param.getParamName())
                                .and(qBatchJobExecution.batchJobExecutionParams.any().parameterValue.eq(param.getParamValue()));
                    }
                })
                .toArray(Predicate[]::new);


        return ExpressionUtils.allOf(predicates);
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




