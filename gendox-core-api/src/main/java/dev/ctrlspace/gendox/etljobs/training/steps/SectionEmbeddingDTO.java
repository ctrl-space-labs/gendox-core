package dev.ctrlspace.gendox.etljobs.training.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Ada2Response;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;

public record SectionEmbeddingDTO(DocumentInstanceSection section, Ada2Response ada2Response) {
}
