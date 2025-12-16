package dev.ctrlspace.gendox.spring.batch.jobs.documentDigitization.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxRuntimeException;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DownloadService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.ExitStatus;
import org.springframework.batch.core.StepExecution;
import org.springframework.batch.core.StepExecutionListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class TempFileCleanupListener implements StepExecutionListener {

    Logger logger = LoggerFactory.getLogger(TempFileCleanupListener.class);

    private DownloadService downloadService;

    @Autowired
    public TempFileCleanupListener(DownloadService downloadService) {
        this.downloadService = downloadService;
    }


    @Override
    public ExitStatus afterStep(StepExecution stepExecution) {
        Long jobInstanceId = stepExecution
                .getJobExecution()
                .getJobInstance()
                .getInstanceId();

        String prefix = "digitization-instance-id-" + jobInstanceId;

        Path tempDir = null;
        try {
            tempDir = downloadService.getTempDir();
        } catch (IOException e) {
            throw new GendoxRuntimeException(HttpStatus.BAD_REQUEST, "FAILED_TO_GET_TEMP_PATH", "Failed to get temp path", e);
        }

        if (!Files.exists(tempDir)) {
            logger.trace("Temp dir {} does not exist, nothing to clean up.", tempDir);
            return stepExecution.getExitStatus();
        }

        AtomicInteger deletedCount = new AtomicInteger(0);

        // Use a DirectoryStream with a glob to only iterate matching files
        try (DirectoryStream<Path> stream =
                     Files.newDirectoryStream(tempDir, prefix + "*")) {

            for (Path path : stream) {
                try {
                    Files.deleteIfExists(path);
                    deletedCount.incrementAndGet();
                    logger.trace("Deleted temp file: {}", path);
                } catch (IOException e) {
                    logger.warn("Failed to delete temp file: {}", path, e);
                }
            }
        } catch (IOException e) {
            logger.warn("Failed to scan temp directory {} for prefix {}", tempDir, prefix, e);
        }

        logger.info("Deleted {} temp files for digitization job instance {}.",
                deletedCount.get(), jobInstanceId);

        return stepExecution.getExitStatus();
    }
}
