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
        query = " SELECT eg.section_id as id, emb.embedding_vector <-> cast(:embedding as vector) as distance \n" +
                "    FROM gendox_core.embedding emb\n" +
                "    inner join gendox_core.embedding_group eg on emb.id = eg.embedding_id\n" +
                "    inner join gendox_core.document_instance_sections sec on eg.section_id = sec.id\n" +
                "    inner join gendox_core.document_instance di on di.id = sec.document_instance_id\n" +
                "    inner join gendox_core.project_documents pd on di.id = pd.document_id\n" +
                "    where pd.project_id = :projectId AND eg.section_id is not null\n" +
                "    ORDER BY emb.embedding_vector <-> cast(:embedding as vector) LIMIT :pageSize",
        resultSetMapping = "SectionDistanceDTOMapping"
)
public class SectionDistanceDTO {

    @Id
    private UUID sectionsId;
    private double distance;

}
