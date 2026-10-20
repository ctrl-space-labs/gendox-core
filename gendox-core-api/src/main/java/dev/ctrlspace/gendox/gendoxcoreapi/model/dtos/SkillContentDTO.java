package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** A whole SKILL.md, as written or uploaded in the skill editor. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SkillContentDTO {
    private String content;
}
