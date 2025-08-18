package dev.ctrlspace.gendox.spring.batch.backfill;

import dev.ctrlspace.gendox.gendoxcoreapi.services.DownloadService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Thin wrapper around DownloadService that already implements:
 *   Integer countDocumentPages(String documentUrl) throws Exception
 */
@Component
@RequiredArgsConstructor
public class DocumentPageCounter {

    private final DownloadService downloadService;

    public Integer count(String documentUrl) throws Exception {
        return downloadService.countDocumentPages(documentUrl);
    }
}