package dev.ctrlspace.gendox.gendoxcoreapi.services.integrations;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Integration;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;


public interface IntegrationUpdateService {
    List<MultipartFile> checkForUpdates(Integration integration);
}
