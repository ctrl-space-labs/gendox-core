package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos;


import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;


@Entity
@SqlResultSetMapping(
        name = "AiModelMessageMapping",
        classes = {
                @ConstructorResult(
                        targetClass = AiModelMessage.class,
                        columns = {
                                @ColumnResult(name = "id", type = UUID.class),
                                @ColumnResult(name = "value", type = String.class),
                                @ColumnResult(name = "name", type = String.class),
                                @ColumnResult(name = "created_at", type = Instant.class)
                        }
                )
        }
)
@NamedNativeQuery(
        name = "AiModelMessage.findPreviousMessages",
        query = """
                select m.id, m.value, t.name, m.created_at
                from gendox_core.message m
                         left join gendox_core.users u on u.id = m.created_by
                         left join gendox_core.types t on t.id = u.users_type_id
                where m.thread_id = :threadId and m.created_at < :before
                order by m.created_at desc
                limit :size
                """,
        resultSetMapping = "AiModelMessageMapping"
)
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class AiModelMessage {
    @Id
    @JsonIgnore
    private UUID id;
    private String content;
    private String role;
    @JsonIgnore
    private Instant createdAt;
}
