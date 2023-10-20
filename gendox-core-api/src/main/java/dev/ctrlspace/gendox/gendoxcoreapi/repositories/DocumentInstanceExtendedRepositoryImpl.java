package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import com.querydsl.core.types.Predicate;
import com.querydsl.core.types.dsl.PathBuilderFactory;
import com.querydsl.jpa.JPQLQuery;
import com.querydsl.jpa.impl.JPAQuery;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QDocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QProjectDocument;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.support.Querydsl;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

public class DocumentInstanceExtendedRepositoryImpl implements DocumentInstanceExtendedRepository {

    @Autowired
    private EntityManager entityManager;


    public Page<DocumentInstance> findAllByPredicate(Predicate predicate, Pageable pageable) {
        Querydsl querydsl = new Querydsl(entityManager, (new PathBuilderFactory()).create(DocumentInstance.class));

        JPQLQuery<DocumentInstance> query = new JPAQuery<>(entityManager);
        query.from(QDocumentInstance.documentInstance)
                .innerJoin(QProjectDocument.projectDocument)
                .on(QProjectDocument.projectDocument.documentId.eq(QDocumentInstance.documentInstance.id))
                .where(predicate);
        Long total = query.fetchCount();
        if (total == 0) {
            return new PageImpl<>(Collections.emptyList(), pageable, total);
        }
        query = querydsl.applyPagination(pageable, query);
        List<DocumentInstance> documents = query.fetch();

        return new PageImpl<>(documents, pageable, total);
    }

}
