package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ChatThreadCriteria {
    @Size(min = 1, message = "At least one project ID must be provided")
    private List<UUID> projectIdIn = new ArrayList<>();
    private List<UUID> memberIdIn = new ArrayList<>();

}
