package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import id.walt.crypto.keys.LocalKey;
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
public class WalletKeyDTO {

        private UUID id;
        private UUID organizationId;
        private LocalKey localKey;
        private Type keyTypeId;
        private Integer characterLength;
        private Instant createdAt;
        private Instant updatedAt;
        private String jwkKeyFormat;
        private UUID createdBy;
        private UUID updatedBy;
}
