package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.EOTaskGeometry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EOTaskGeometryRepository extends JpaRepository<EOTaskGeometry, UUID>, QuerydslPredicateExecutor<EOTaskGeometry> {

    List<EOTaskGeometry> findByTaskIdOrderByDisplayOrderAsc(UUID taskId);

}
