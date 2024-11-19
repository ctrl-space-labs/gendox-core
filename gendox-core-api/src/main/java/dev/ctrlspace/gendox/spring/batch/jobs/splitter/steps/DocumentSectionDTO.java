package dev.ctrlspace.gendox.spring.batch.jobs.splitter.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;

import java.util.List;

public record DocumentSectionDTO(DocumentInstance documentInstance, List<String> contentSections, Boolean documentUpdated) {
}
