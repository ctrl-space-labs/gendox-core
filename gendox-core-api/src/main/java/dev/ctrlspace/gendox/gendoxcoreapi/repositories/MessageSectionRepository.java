package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.MessageSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;

import java.util.UUID;

@Repository
public interface MessageSectionRepository extends JpaRepository<MessageSection, UUID>, QuerydslPredicateExecutor<MessageSection> {


}
