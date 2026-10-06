package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * The one thing this endpoint is allowed to change. A whole IntegrationDTO would let a
 * client move an integration to another organization, project or type on the way past.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class IntegrationActiveDTO {
    private Boolean active;
}