package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Template;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public interface TemplateRepository extends JpaRepository<Template, UUID>, QuerydslPredicateExecutor<Template> {

    @Query("SELECT t.id FROM Template t WHERE t.isDefault = true AND t.templateType.name = :templateTypeName")
    UUID findIdByIsDefaultTrueAndTemplateTypeName(@Param("templateTypeName") String templateTypeName);


    Template findByIdIs(UUID id);


}
