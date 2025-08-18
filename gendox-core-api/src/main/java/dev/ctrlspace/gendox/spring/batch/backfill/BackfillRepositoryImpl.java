package dev.ctrlspace.gendox.spring.batch.backfill;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Slf4j
@Repository
@RequiredArgsConstructor
public class BackfillRepositoryImpl implements BackfillRepository {

    private final JdbcTemplate jdbc;

    @Override
    public List<BackfillPagesService.Row> fetchBatch(int limit, String fileTypes) {
        String whereClause = buildFileTypeFilter(fileTypes);
        
        String sql = String.format("""
            SELECT id, remote_url
              FROM gendox_core.document_instance
             WHERE number_of_pages IS NULL
               AND page_count_error IS NULL
               AND remote_url IS NOT NULL
               AND remote_url != ''
               AND %s
             ORDER BY id
             FOR UPDATE SKIP LOCKED
             LIMIT ?
        """, whereClause);
        
        log.debug("Fetching batch with file types filter: {}", fileTypes);
        
        return jdbc.query(sql, (rs, i) -> new BackfillPagesService.Row(
            UUID.fromString(rs.getString("id")), 
            rs.getString("remote_url")
        ), limit);
    }

    @Override
    public long estimateRemaining(String fileTypes) {
        String whereClause = buildFileTypeFilter(fileTypes);
        
        String sql = String.format("""
            SELECT COUNT(*) FROM gendox_core.document_instance
            WHERE number_of_pages IS NULL
              AND page_count_error IS NULL
              AND remote_url IS NOT NULL
              AND remote_url != ''
              AND %s
        """, whereClause);
        
        Long cnt = jdbc.queryForObject(sql, Long.class);
        return cnt == null ? -1 : cnt;
    }

    @Override
    public int updatePageCount(UUID id, Integer pages) {
        return jdbc.update("""
            UPDATE gendox_core.document_instance
               SET number_of_pages = ?, page_count_error = NULL, updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND number_of_pages IS NULL
        """, pages, id);
    }

    @Override
    public int updatePageCountError(UUID id, String errorMessage) {
        return jdbc.update("""
            UPDATE gendox_core.document_instance
               SET page_count_error = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND number_of_pages IS NULL
        """, errorMessage, id);
    }

    /**
     * Builds the file type filter clause from comma-separated file extensions.
     * Creates OR conditions for LIKE queries on the remote_url column.
     */
    private String buildFileTypeFilter(String fileTypes) {
        String[] extensions = fileTypes.split(",");
        StringBuilder whereClause = new StringBuilder();
        whereClause.append("(");
        for (int i = 0; i < extensions.length; i++) {
            if (i > 0) whereClause.append(" OR ");
            whereClause.append("LOWER(remote_url) LIKE '%").append(extensions[i].trim().toLowerCase()).append("'");
        }
        whereClause.append(")");
        return whereClause.toString();
    }
}