package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.ChatThreadMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ChatThreadMemberRepository extends JpaRepository<ChatThreadMember, UUID> {

    void deleteByChatThread_Id(UUID threadId);

}
