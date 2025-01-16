package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
@Entity
@SqlResultSetMapping(
        name = "SectionDistanceDTOMapping",
        classes = {
                @ConstructorResult(
                        targetClass = SectionDistanceDTO.class,
                        columns = {
                                @ColumnResult(name = "id", type = UUID.class),
                                @ColumnResult(name = "distance", type = Double.class)
                        }
                )
        }
)
@NamedNativeQuery(
        name = "SectionDistanceDTO.findClosestSectionIdsWithDistance",
//        Be careful, some Project have partial index on these fields, if you change this query, make sure to update the index
        query = """
                SELECT emb.section_id as id,
                       emb.embedding_vector <-> CAST(:embedding AS vector) AS distance
                FROM gendox_core.embedding emb
                WHERE emb.project_id = :projectId
                  AND emb.section_id IS NOT NULL
                  AND emb.semantic_search_model_id = :semanticSearchModelId
                ORDER BY CAST(emb.embedding_vector AS vector(1536)) <-> cast(:embedding as vector)
                LIMIT :pageSize OFFSET :offset
              """,
        resultSetMapping = "SectionDistanceDTOMapping"
)
public class SectionDistanceDTO {

    @Id
    private UUID sectionsId;
    private double distance;

}
