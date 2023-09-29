package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import com.pgvector.PGvector;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Embedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Repository
public interface EmbeddingRepository extends JpaRepository<Embedding, UUID>, QuerydslPredicateExecutor<Embedding> {

    @Query(value = "SELECT * FROM embedding e ORDER BY e.embedding <-> :vector LIMIT :limit", nativeQuery = true)
    List<Map<String, Object>> findNearestNeighbors(@Param("vector") PGvector vector, @Param("limit") int limit);

    @Query(nativeQuery = true, value = "SELECT * FROM gendox_core.embedding ORDER BY embedding_vector <-> cast(? as vector) LIMIT 5")
    List<Embedding> findNearestNeighbors(String embedding);

    @Query(nativeQuery = true, value = " SELECT emb.*\n" +
            "    FROM gendox_core.embedding emb\n" +
            "    inner join gendox_core.embedding_group eg on emb.id = eg.embedding_id\n" +
            "    inner join gendox_core.document_instance_sections sec on eg.section_id = sec.id\n" +
            "    inner join gendox_core.document_instance di on di.id = sec.document_instance_id\n" +
            "    inner join gendox_core.project_documents pd on di.id = pd.document_id\n" +
            "    where pd.project_id = ? AND eg.section_id is not null\n" +
            "    ORDER BY emb.embedding_vector <-> cast(? as vector) LIMIT 5")
    List<Embedding> findClosestSections(UUID projectId, String embedding);





    // Find nearest neighbors by a record in the same table
    @Query(nativeQuery = true, value = "SELECT * FROM embeddings WHERE id != :id ORDER BY embedding <-> (SELECT embedding FROM items WHERE id = :id) LIMIT 5")
    List<Embedding> findNearestNeighbors(UUID id);

}
