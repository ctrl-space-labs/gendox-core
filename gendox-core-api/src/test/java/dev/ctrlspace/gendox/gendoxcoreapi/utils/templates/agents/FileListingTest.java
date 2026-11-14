package dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.agents;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

class FileListingTest {

    @Test
    void aFileIsOneLineWithItsPathItsMetadataAndItsId() {
        DocumentInstance report = new DocumentInstance();
        report.setId(UUID.fromString("1c4b2e90-0000-0000-0000-000000000001"));
        report.setTitle("annual-report.pdf");
        report.setFileSizeBytes(2_516_582L);
        report.setNumberOfPages(312);
        report.setTotalTokens(410_000L);
        report.setUpdatedAt(Instant.parse("2026-11-12T14:03:40Z"));

        assertEquals("./uploads\n./uploads/annual-report.pdf | size=2.4MB | pages=312 | tokens=410000"
                        + " | modified=2026-11-12 14:03 | UUID=1c4b2e90-0000-0000-0000-000000000001",
                FileListing.list(FileListing.UPLOADS, List.of(report)));
    }

    @Test
    void whatIsNotKnownShowsAsADashAndAFileWithoutATitleIsNamedByItsLocation() {
        DocumentInstance bare = new DocumentInstance();
        bare.setRemoteUrl("s3://bucket/organization/notes.txt");
        bare.setFileSizeBytes(900L);

        assertEquals("./knowledge/notes.txt | size=900B | pages=- | tokens=- | modified=- | UUID=-",
                FileListing.line(FileListing.KNOWLEDGE, bare));
    }
}
