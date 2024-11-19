package dev.ctrlspace.gendox.spring.batch.jobs.training.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.EmbeddingResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;

public record SectionEmbeddingDTO(DocumentInstanceSection section, EmbeddingResponse embeddingResponse,  String sectionSha256Hash) {
}
