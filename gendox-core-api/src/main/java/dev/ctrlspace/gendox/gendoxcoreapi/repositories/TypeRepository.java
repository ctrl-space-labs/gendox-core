package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;


import java.util.UUID;

@Repository
public interface TypeRepository extends JpaRepository<Type, Long>, QuerydslPredicateExecutor<Type>{

    Type getByTypeCategoryAndName(String typeCategory, String name);
}
