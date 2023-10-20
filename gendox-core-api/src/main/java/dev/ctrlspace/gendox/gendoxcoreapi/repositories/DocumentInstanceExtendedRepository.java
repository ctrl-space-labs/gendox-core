package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import com.querydsl.core.types.Predicate;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface DocumentInstanceExtendedRepository {


    Page<DocumentInstance> findAllByPredicate(Predicate predicate, Pageable pageable);

}
