
package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class OrganizationDTO {
    private UUID id;
    private String name;

    private String displayName;

    private String address;

    private String phone;

    private Instant createdAt;

    private Instant updatedAt;

}
