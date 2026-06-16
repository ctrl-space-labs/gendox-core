package dev.ctrlspace.gendox.gendoxcoreapi.utils.document;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import org.docx4j.Docx4J;
import org.docx4j.fonts.PhysicalFonts;
import org.docx4j.openpackaging.exceptions.Docx4JException;
import org.docx4j.openpackaging.packages.WordprocessingMLPackage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

/**
 * Converts {@code .docx} files to PDF using docx4j-export-fo (Apache FOP).
 * Output PDFs are cached under the gendox temp directory for reuse within a JVM run.
 * Legacy {@code .doc} is not supported by docx4j — use LibreOffice or keep POI text extraction.
 */
@Component
public class WordToPdfConverter {

    private static final Logger logger = LoggerFactory.getLogger(WordToPdfConverter.class);

    /**
     * Converts the DOCX at {@code docxFile} to a cached PDF in {@code tempDir}.
     *
     * @param docxFile  path to a local {@code .docx} file
     * @param cacheKey  stable key for the cache file (typically the document URL)
     * @param tempDir   directory for cached PDFs (e.g. {@code DownloadService#getTempDir()})
     * @return path to the generated (or cached) PDF
     */
    public Path convertDocxToPdf(Path docxFile, String cacheKey, Path tempDir) throws GendoxException, IOException {
        Files.createDirectories(tempDir);
        Path pdfPath = tempDir.resolve(buildPdfCacheFileName(cacheKey));

        if (Files.exists(pdfPath) && Files.size(pdfPath) > 0) {
            logger.debug("Reusing cached DOCX PDF: {}", pdfPath);
            return pdfPath;
        }

        PhysicalFonts.setRegex(".*(calibri|cambria|arial|times|cour|symbol|wing).*");

        try {
            WordprocessingMLPackage pkg = WordprocessingMLPackage.load(docxFile.toFile());
            try (OutputStream out = Files.newOutputStream(pdfPath, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING)) {
                Docx4J.toPDF(pkg, out);
            }
            logger.debug("Converted DOCX to PDF: {} -> {}", docxFile, pdfPath);
            return pdfPath;
        } catch (Docx4JException e) {
            throw new GendoxException(
                    "ERROR_DOCX_TO_PDF",
                    "Failed to convert DOCX to PDF: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    e);
        }
    }

    private static String buildPdfCacheFileName(String cacheKey) {
        int hash = cacheKey != null ? cacheKey.hashCode() : 0;
        return "docx-pdf-" + Integer.toUnsignedString(hash) + ".pdf";
    }
}
