package dev.ctrlspace.gendox.spring.batch.backfill;

import java.util.List;
import java.util.UUID;

public interface BackfillRepository {
    
    /**
     * Fetches a batch of document instances that need page count processing.
     * Uses FOR UPDATE SKIP LOCKED for safe concurrent access.
     * 
     * @param limit maximum number of rows to fetch
     * @param fileTypes comma-separated list of file extensions to filter by
     * @return list of document rows to process
     */
    List<BackfillPagesService.Row> fetchBatch(int limit, String fileTypes);
    
    /**
     * Estimates the remaining number of documents that need page count processing.
     * 
     * @param fileTypes comma-separated list of file extensions to filter by
     * @return estimated count of remaining documents
     */
    long estimateRemaining(String fileTypes);
    
    /**
     * Updates a document instance with the calculated page count.
     * Only updates if number_of_pages is still NULL (idempotent).
     * 
     * @param id document instance ID
     * @param pages calculated page count
     * @return number of rows updated (0 or 1)
     */
    int updatePageCount(UUID id, Integer pages);
    
    /**
     * Records an error message for a document instance that failed page counting.
     * Only updates if number_of_pages is still NULL (idempotent).
     * 
     * @param id document instance ID
     * @param errorMessage truncated error message
     * @return number of rows updated (0 or 1)
     */
    int updatePageCountError(UUID id, String errorMessage);
}