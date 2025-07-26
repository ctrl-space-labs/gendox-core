package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic;


import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ContentPart;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.ObjectMapperUtil;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.core.type.TypeReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
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
                WITH numbered AS (
                  SELECT m.id, m.value, m.role, m.tool_call_id, m.name, m.tool_calls, m.created_at,
                         row_number() OVER (ORDER BY m.created_at DESC) AS rn,   -- 1 = newest 
                         count(*)     OVER ()                                   AS total
                  FROM gendox_core.message m
                  LEFT JOIN gendox_core.users u  ON u.id = m.created_by
                  LEFT JOIN gendox_core.types t  ON t.id = u.users_type_id
                  WHERE m.thread_id   = :threadId
                    AND m.created_at <  :before
                )
                SELECT id, value, role, tool_call_id, name, tool_calls, created_at
                FROM numbered
                WHERE rn <= (:window_size + (total % :window_size))
                ORDER BY created_at DESC;
                """,
        resultSetMapping = "AiModelMessageMapping"
)
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class AiModelMessage {

    private static Logger logger = LoggerFactory.getLogger(AiModelMessage.class);

    @Id
    @JsonIgnore
    private UUID id;

    // dont serialize it directly, combine it with contentParts
    @JsonIgnore
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

    // this will be used when there are multiple content objects in a message (like image inputs)
    @Transient
    @JsonIgnore
    private List<ContentPart> contentParts = new ArrayList<>();

    @JsonIgnore
    private Instant createdAt;

    /**
     * Constructor to handle the named query. Ignore contentParts.
     *
     * @param id
     * @param content
     * @param role
     * @param toolCallId
     * @param name
     * @param toolCalls
     * @param createdAt
     */
    public AiModelMessage(UUID id, String content, String role, String toolCallId, String name, JsonNode toolCalls, Instant createdAt) {
        this.id = id;
        this.content = content;
        this.role = role;
        this.toolCallId = toolCallId;
        this.name = name;
        this.toolCalls = toolCalls;
        this.createdAt = createdAt;
    }

    /**
     * JSON getter for "content":
     *  - if contentParts is null → plain text
     *  - otherwise → build a new List<ContentPart> that
     *      a) prepends a text part only if none exists,
     *      b) then adds all the others
     */
    @JsonProperty("content")
    public Object getJsonContent() {
        if (contentParts == null || contentParts.isEmpty())  {
            return content;
        }

        List<ContentPart> out = new ArrayList<>(contentParts);

        boolean hasText = out.stream()
                .anyMatch(p -> "text".equals(p.getType()));
        // only add if we actually have a content String and no text part
        if (!hasText && content != null) {
            out.addFirst(ContentPart.builder()
                    .type("text")
                    .text(content)
                    .build());
        }
        if (hasText && content != null) {
            logger.debug("ContentPart with type 'text' exists, while also content field has value.");
        }

        return out;
    }

    /**
     * JSON setter for "content":
     *  - string → text‑only
     *  - array  → map to List<ContentPart>, then pull off at most one "text"
     *     (first one) into ‑content‑ and leave the rest in contentParts.
     */
    @JsonProperty("content")
    public void setJsonContent(JsonNode node) {
        if (node == null || node.isNull()) {
            this.content = null;
            this.contentParts = null;
        }
        else if (node.isTextual()) {
            // simple text
            this.content = node.asText();
            this.contentParts = null;
        }
        else if (node.isArray()) {

            List<ContentPart> all = ObjectMapperUtil.MAPPER
                    .convertValue(node, new TypeReference<List<ContentPart>>() {});


            String firstText = all.stream()
                    .filter(p -> "text".equals(p.getType()) && p.getText() != null)
                    .map(ContentPart::getText)
                    .findFirst()
                    .orElse(null);

            this.content = firstText;
            this.contentParts = all ;

        }
        else {
            throw new IllegalArgumentException(
                    "Unsupported 'content' JSON type: " + node.getNodeType()
            );
        }
    }


}
