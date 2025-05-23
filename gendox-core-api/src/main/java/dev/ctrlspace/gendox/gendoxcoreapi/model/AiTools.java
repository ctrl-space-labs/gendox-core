package dev.ctrlspace.gendox.gendoxcoreapi.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ai_tools", schema = "gendox_core")
public class AiTools {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "type", nullable = false)
    private String type;  // function

    @JdbcTypeCode(SqlTypes.JSON)        // transform it to jsonb in postgresql
    @Column(name = "json_schema", columnDefinition = "JSONB", nullable = false)
    private String jsonSchema;

    @JsonIgnore
    @JsonBackReference(value = "aiTools")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "agent_id", referencedColumnName = "id", nullable = false)
    private ProjectAgent agent;
}
