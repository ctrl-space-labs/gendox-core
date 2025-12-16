package dev.ctrlspace.gendox.spring.batch.repositories;

import com.querydsl.core.types.Predicate;
import dev.ctrlspace.gendox.spring.batch.model.BatchJobExecution;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BatchJobExecutionRepositoryCustom {

    Page<BatchJobExecution> findAllPageableWithExecutionParams(Predicate predicate, Pageable pageable);
}
