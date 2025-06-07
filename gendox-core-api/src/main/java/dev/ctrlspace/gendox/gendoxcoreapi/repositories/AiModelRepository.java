package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AiModelRepository extends JpaRepository<AiModel, UUID>, QuerydslPredicateExecutor<AiModel> {

    Optional<AiModel> findByName(@Param("name") String name);

//    AiModel findAiModelByName


    @Query("SELECT a.url FROM AiModel a WHERE a.model = :model")
    String findUrlByModel(String model);

    List<AiModel> findByAiModelType(Type type);

    @Query("SELECT a.name FROM AiModel a WHERE a.id = :id")
    String findNameById(@Param("id") UUID id);

    @Query("SELECT a FROM AiModel a WHERE a.organizationId is null")
    List<AiModel> findAllPublicModels();

    @EntityGraph(attributePaths = { "aiModelProvider", "modelTierType", "aiModelType" })
    @Query("SELECT a FROM AiModel a WHERE (a.organizationId = :organizationId or a.organizationId is null) and a.isActive = true")
    List<AiModel> findAllActiveModelsByOrganizationId(@Param("organizationId") UUID organizationId);



}
