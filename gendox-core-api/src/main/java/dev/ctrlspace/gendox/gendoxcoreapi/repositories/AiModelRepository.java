package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;

import java.util.UUID;

@Repository
public interface AiModelRepository extends JpaRepository<AiModel, UUID>, QuerydslPredicateExecutor<AiModel> {

    AiModel findByName(@Param("name") String name);

//    AiModel findAiModelByName


    @Query("SELECT a.url FROM AiModel a WHERE a.model = :model")
    String findUrlByModel(String model);
}
