package dev.ctrlspace.gendox.spring.batch.repositories;

import com.querydsl.core.types.Expression;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Predicate;
import com.querydsl.core.types.dsl.CaseBuilder;
import com.querydsl.core.types.dsl.ComparableExpressionBase;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.PathBuilder;
import com.querydsl.jpa.impl.JPAQueryFactory;
import dev.ctrlspace.gendox.spring.batch.model.BatchJobExecution;
import dev.ctrlspace.gendox.spring.batch.model.QBatchJobExecution;
import dev.ctrlspace.gendox.spring.batch.model.QBatchJobExecutionParams;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;


@Repository
@Transactional(readOnly = true)
public class BatchJobExecutionRepositoryCustomImpl implements BatchJobExecutionRepositoryCustom {

    private final JPAQueryFactory queryFactory;
    private final BatchJobExecutionRepository batchJobExecutionRepository;

    @Autowired
    public BatchJobExecutionRepositoryCustomImpl(
            JPAQueryFactory queryFactory,
            @Lazy BatchJobExecutionRepository batchJobExecutionRepository
    ) {
        this.queryFactory = queryFactory;
        this.batchJobExecutionRepository = batchJobExecutionRepository;
    }



    @Override
    public Page<BatchJobExecution> findAllPageableWithExecutionParams(Predicate criteriaPredicate, Pageable pageable) {
        QBatchJobExecution bje = QBatchJobExecution.batchJobExecution;
        QBatchJobExecutionParams bjep = QBatchJobExecutionParams.batchJobExecutionParams;

        // --- Step 1: page IDs (no fetch join), keep ordering
        List<Long> ids = queryFactory
                .select(bje.jobExecutionId)
                .from(bje)
                .leftJoin(bje.batchJobExecutionParams, bjep) // safe; not a fetch join
                .where(criteriaPredicate)
                .groupBy(bje.jobExecutionId)
                .orderBy(buildOrderSpecifiers(pageable, bje, bjep))
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        if (ids.isEmpty()) {
            // still compute total to be precise (or return 0 fast if you prefer)
            long totalEmpty = countDistinct(criteriaPredicate, bje, bjep);
            return new PageImpl<>(List.of(), pageable, totalEmpty);
        }

        // --- Step 2: load entities + collection via EntityGraph
        List<BatchJobExecution> rows = batchJobExecutionRepository.findByJobExecutionIdIn(ids);

        // --- Step 2b: restore original page order (IN() doesn’t guarantee order)
        Map<Long, Integer> pos = new HashMap<>(ids.size());
        for (int i = 0; i < ids.size(); i++) {
            pos.put(ids.get(i), i);
        }
        rows.sort(Comparator.comparingInt(r -> pos.getOrDefault(r.getJobExecutionId(), Integer.MAX_VALUE)));

        // --- Step 3: total count (distinct parents) for Page
        long total = countDistinct(criteriaPredicate, bje, bjep);

        return new PageImpl<>(rows, pageable, total);
    }

    private long countDistinct(Predicate predicate, QBatchJobExecution bje, QBatchJobExecutionParams bjep) {
        Long val = queryFactory
                .select(bje.jobExecutionId.countDistinct())
                .from(bje)
                .leftJoin(bje.batchJobExecutionParams, bjep)
                .where(predicate)
                .fetchOne();
        return val == null ? 0L : val;
    }

    /**
     * Supports common BJE fields; supports sorting by a specific param via "batchJobExecutionParams.<name>".
     * Examples:
     *  - sort=startTime,desc
     *  - sort=status,asc
     *  - sort=batchJobExecutionParams.fileName,asc
     */
    private OrderSpecifier<?>[] buildOrderSpecifiers(Pageable pageable,
                                                     QBatchJobExecution bje,
                                                     QBatchJobExecutionParams bjep) {
        if (pageable == null || pageable.getSort().isEmpty()) {
            // default: newest first by startTime if present, else id desc
            return new OrderSpecifier[]{bje.createTime.desc()};
        }

        PathBuilder<BatchJobExecution> root =
                new PathBuilder<>(BatchJobExecution.class, "batchJobExecution");

        List<OrderSpecifier<?>> specs = new ArrayList<>();

        for (Sort.Order o : pageable.getSort()) {
            com.querydsl.core.types.Order dir =
                    o.isAscending() ? com.querydsl.core.types.Order.ASC : com.querydsl.core.types.Order.DESC;

            String prop = o.getProperty();

            // batchJobExecutionParams.<name> → ORDER BY MAX(CASE WHEN name='<name>' THEN value END)
            if (prop.startsWith("batchJobExecutionParams.")) {
                String paramName = prop.substring("batchJobExecutionParams.".length());

                specs.add(new OrderSpecifier<>(
                        dir,
                        new CaseBuilder()
                                .when(bjep.parameterName.eq(paramName)).then(bjep.parameterValue)
                                .otherwise((String) null)
                                .max(),
                        OrderSpecifier.NullHandling.NullsLast
                ));
                continue;
            }

            // Generic: any comparable entity property (e.g., startTime, endTime, status, jobExecutionId, createTime, …)
            try {
                ComparableExpressionBase<?> expr = root.getComparable(prop, Comparable.class);
                specs.add(new OrderSpecifier<>(dir, expr, OrderSpecifier.NullHandling.NullsLast));
            } catch (IllegalArgumentException ex) {
                // fail fast
                throw new IllegalArgumentException("Unsupported sort property: " + prop, ex);
            }
        }

        return specs.toArray(new OrderSpecifier<?>[0]);
    }


}
