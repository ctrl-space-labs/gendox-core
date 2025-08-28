package dev.ctrlspace.gendox.spring.batch.repositories.specifications;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.util.StringUtils;
import com.querydsl.jpa.JPAExpressions;
import dev.ctrlspace.gendox.spring.batch.model.QBatchJobExecution;
import dev.ctrlspace.gendox.spring.batch.model.QBatchJobExecutionParams;
import dev.ctrlspace.gendox.spring.batch.model.QBatchJobInstance;
import dev.ctrlspace.gendox.spring.batch.model.criteria.BatchExecutionCriteria;
import dev.ctrlspace.gendox.spring.batch.model.criteria.BatchExecutionParamCriteria;

import java.util.List;

public class BatchExecutionPredicates {

    private static QBatchJobExecution qBatchJobExecution = QBatchJobExecution.batchJobExecution;
    private static QBatchJobInstance qBatchJobInstance = QBatchJobInstance.batchJobInstance;
    private static QBatchJobExecutionParams qBatchJobExecutionParams  = QBatchJobExecutionParams.batchJobExecutionParams;


    public static Predicate build(BatchExecutionCriteria criteria) {
        return ExpressionUtils.allOf(
                jobName(criteria.getJobName()),
                status(criteria.getStatus()),
                exitCode(criteria.getExitCode()),
                jobExecutionIdsIn(criteria.getJobExecutionIdsIn()),
                allParams(criteria.getMatchAllParams())
        );
    }

    private static Predicate allParams(List<BatchExecutionParamCriteria> matchAllParams) {

        if (matchAllParams == null || matchAllParams.isEmpty()) {
            return null;
        }

        Predicate[] predicates = matchAllParams.stream()
                .map(param -> {

                    BooleanExpression paramPred =
                            JPAExpressions
                                    .selectOne()
                                    .from(qBatchJobExecutionParams)
                                    .where(
                                            qBatchJobExecutionParams.batchJobExecution.eq(qBatchJobExecution)                       // correlate
                                                    .and(qBatchJobExecutionParams.parameterName.eq(param.getParamName()))
                                                    .and(param.getParamValue() == null
                                                            ? qBatchJobExecutionParams.parameterValue.isNull()
                                                            : qBatchJobExecutionParams.parameterValue.eq(param.getParamValue()))
                                    )
                                    .exists();                                               // <-- ONE EXISTS

                    return paramPred;
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

    private static Predicate jobExecutionIdsIn(List<Long> jobExecutionIds) {
        if (jobExecutionIds == null || jobExecutionIds.isEmpty()) {
            return null;
        }
        return qBatchJobExecution.jobExecutionId.in(jobExecutionIds);
    }
}




