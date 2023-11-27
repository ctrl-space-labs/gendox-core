package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;


import java.util.List;
import java.util.Optional;

@Repository
public interface TypeRepository extends JpaRepository<Type, Long>, QuerydslPredicateExecutor<Type>{

    @Cacheable(value = "TypeByTypeCategoryAndName", keyGenerator = "gendoxKeyGenerator")
    Optional<Type> findByTypeCategoryAndName(String typeCategory, String name);
    List<Type> findByTypeCategory(String typeCategory);
    Optional<Type> findByName(String name);
}
