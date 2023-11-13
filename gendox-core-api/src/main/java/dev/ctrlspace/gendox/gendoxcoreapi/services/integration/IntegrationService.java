package dev.ctrlspace.gendox.gendoxcoreapi.services.integration;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Integration;

import java.nio.file.Path;
import java.util.List;

public interface IntegrationService {
    List<Path> checkForUpdates();
}
