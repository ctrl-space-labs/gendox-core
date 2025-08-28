package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import com.querydsl.core.types.Predicate;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ChatThreadLastMessageDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;


public interface ChatThreadRepositoryCustom {
    Page<ChatThreadLastMessageDTO> findAllThreads(Predicate criteriaPredicate, Pageable pageable);
}
