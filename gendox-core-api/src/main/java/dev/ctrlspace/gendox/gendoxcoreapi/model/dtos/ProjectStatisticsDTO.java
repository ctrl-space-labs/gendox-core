package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * How many documents and members a project has, as the agent list's cards show them.
 * Members don't count the agents' own users, as the Members screen lists them.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProjectStatisticsDTO {
    private UUID projectId;
    private long documentCount;
    private long memberCount;
}