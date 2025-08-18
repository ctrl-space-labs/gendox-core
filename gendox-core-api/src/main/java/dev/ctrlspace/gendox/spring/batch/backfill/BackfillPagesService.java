package dev.ctrlspace.gendox.spring.batch.backfill;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BackfillPagesService {

    private final BackfillRepository backfillRepository;
    private final DocumentPageCounter pageCounter;

    @Value("${gendox.batch-jobs.backfill.pages.batch-size:200}")
    private int batchSize;
    
    @Value("${gendox.batch-jobs.backfill.pages.file-types:.pdf,.docx,.doc,.ppt,.pptx}")
    private String fileTypes;

    /**
     * Idempotent backfill loop:
     * - Picks a batch of rows where number_of_pages is NULL
     * - Computes page count
     * - Updates row only if still NULL (idempotent)
     * - Records truncated error on failure
     * - Repeats until no more rows are updated in a pass
     */
    public void runBackfill() {
        log.info("Starting pages backfill (batchSize={}, fileTypes={})", batchSize, fileTypes);
        int processedInPass;
        long totalProcessed = 0L;
        long totalErrors = 0L;

        do {
            List<Row> batch = backfillRepository.fetchBatch(batchSize, fileTypes);
            if (batch.isEmpty()) {
                log.info("No more candidate rows found (number_of_pages IS NULL).");
                break;
            }

            processedInPass = 0;
            long errorsThisBatch = 0;

            for (Row r : batch) {
                try {
                    Integer pages = pageCounter.count(r.remoteUrl());
                    int updated = backfillRepository.updatePageCount(r.id(), pages);
                    if (updated > 0) {
                        processedInPass++;
                        log.debug("Updated document {} with {} pages", r.id(), pages);
                    }
                } catch (Exception e) {
                    String msg = truncate(e.getMessage(), 300);
                    backfillRepository.updatePageCountError(r.id(), msg);
                    errorsThisBatch++;
                    log.warn("Failed to count pages for id={}, url='{}' -> {}", r.id(), r.remoteUrl(), msg);
                }
            }

            totalProcessed += processedInPass;
            totalErrors += errorsThisBatch;

            log.info("Batch done: updated={}, errors={}, remainingUnknown=~{}", 
                    processedInPass, errorsThisBatch, backfillRepository.estimateRemaining(fileTypes));
                    
            // Brief pause between batches to avoid overwhelming the system
            if (processedInPass > 0) {
                try {
                    Thread.sleep(100);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    log.warn("Backfill interrupted");
                    break;
                }
            }
        } while (processedInPass > 0);

        log.info("Pages backfill finished. totalUpdated={}, totalErrors={}", totalProcessed, totalErrors);
    }


    private static String truncate(String s, int max) {
        if (s == null) return "Unknown error";
        return s.length() > max ? s.substring(0, max - 3) + "..." : s;
    }

    public record Row(UUID id, String remoteUrl) {}
}