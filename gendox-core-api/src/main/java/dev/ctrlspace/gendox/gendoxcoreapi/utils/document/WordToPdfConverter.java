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
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Converts {@code .docx} files to PDF using docx4j-export-fo (Apache FOP).
 * The PDF is written next to its DOCX, as {@code <docx file name>.pdf}, and reused while it is there,
 * so it shares the DOCX's temp-file prefix and is deleted with it.
 * Legacy {@code .doc} is not supported by docx4j — use LibreOffice or keep POI text extraction.
 */
@Component
public class WordToPdfConverter {

    private static final Logger logger = LoggerFactory.getLogger(WordToPdfConverter.class);

    /**
     * Converts the DOCX at {@code docxFile} to a PDF next to it.
     *
     * @param docxFile  path to a local {@code .docx} file
     * @return path to the generated (or already generated) PDF
     */
    public Path convertDocxToPdf(Path docxFile) throws GendoxException, IOException {
        Path pdfPath = docxFile.resolveSibling(docxFile.getFileName() + ".pdf");

        if (Files.exists(pdfPath)) {
            logger.debug("Reusing converted DOCX PDF: {}", pdfPath);
            return pdfPath;
        }

        PhysicalFonts.setRegex(".*(calibri|cambria|arial|times|cour|symbol|wing).*");

        // Written under a name of its own, then moved into place, so a concurrent caller never reads a partial PDF
        Path partialPdf = pdfPath.resolveSibling(pdfPath.getFileName() + "." + UUID.randomUUID() + ".part");
        try {
            WordprocessingMLPackage pkg = WordprocessingMLPackage.load(docxFile.toFile());
            try (OutputStream out = Files.newOutputStream(partialPdf)) {
                Docx4J.toPDF(pkg, out);
            }
            Files.move(partialPdf, pdfPath, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
            logger.debug("Converted DOCX to PDF: {} -> {}", docxFile, pdfPath);
            return pdfPath;
        } catch (Docx4JException e) {
            throw new GendoxException(
                    "ERROR_DOCX_TO_PDF",
                    "Failed to convert DOCX to PDF: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    e);
        } finally {
            Files.deleteIfExists(partialPdf);
        }
    }
}
