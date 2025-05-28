package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic;


import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
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
                                @ColumnResult(name = "role", type = String.class),
                                @ColumnResult(name = "tool_call_id", type = String.class),
                                @ColumnResult(name = "name", type = String.class),
                                @ColumnResult(name = "tool_calls", type = JsonNode.class),
                                @ColumnResult(name = "created_at", type = Instant.class)
                        }
                )
        }
)
@NamedNativeQuery(
        name = "AiModelMessage.findPreviousMessages",
        query = """
                select m.id, m.value, m.role, m.tool_call_id, m.name, m.tool_calls, m.created_at
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
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String content;
    private String role;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonProperty("tool_call_id")
    private String toolCallId;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String name;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonProperty("tool_calls")
    private JsonNode toolCalls;

    @JsonIgnore
    private Instant createdAt;

//    public AiModelMessage(UUID id, String content, String role, Instant createdAt) {
//        this.id = id;
//        this.content = content;
//        this.role = role;
//        this.createdAt = createdAt;
//    }
}
