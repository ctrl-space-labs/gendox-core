package dev.ctrlspace.gendox.spring.batch.backfill;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * REST controller for manually triggering the backfill process.
 * Only available when backfill is enabled in configuration.
 */
@Slf4j
@RestController
@RequestMapping("/admin/backfill")
@RequiredArgsConstructor
@ConditionalOnProperty(name = "gendox.batch-jobs.backfill.pages.auto-after-migrate", havingValue = "true", matchIfMissing = false)
public class BackfillController {

    private final BackfillPagesService backfillService;

    /**
     * Manually trigger the pages backfill process.
     * This will process documents with null page counts according to the file type filter.
     */
    @PostMapping("/pages/run")
    public ResponseEntity<Map<String, Object>> runPagesBackfill() {
        log.info("Manual backfill trigger requested via API");
        
        try {
            long startTime = System.currentTimeMillis();
            backfillService.runBackfill();
            long duration = System.currentTimeMillis() - startTime;
            
            log.info("Manual backfill completed successfully in {}ms", duration);
            
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Pages backfill completed successfully",
                "durationMs", duration
            ));
        } catch (Exception e) {
            log.error("Manual backfill failed", e);
            
            return ResponseEntity.internalServerError().body(Map.of(
                "status", "error",
                "message", "Pages backfill failed: " + e.getMessage()
            ));
        }
    }
}