package dev.ctrlspace.gendox.gendoxcoreapi.utils.document.readers;

import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.documents.PageText;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.state.RenderingMode;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PdfPageTextReaderTest {

    @Test
    void countsOnlyTheTextThatIsDrawn(@TempDir Path dir) throws Exception {
        Path pdf = dir.resolve("pages.pdf");
        try (PDDocument doc = new PDDocument()) {
            addPage(doc, "Digital text", RenderingMode.FILL);
            addPage(doc, "OCR layer", RenderingMode.NEITHER);
            doc.addPage(new PDPage());
            doc.save(pdf.toFile());
        }

        List<PageText> pages = PdfPageTextReader.read(pdf);

        assertEquals(List.of(
                new PageText("Digital text", 11),
                new PageText("OCR layer", 0),
                new PageText("", 0)
        ), pages);
    }

    private static void addPage(PDDocument doc, String text, RenderingMode mode) throws Exception {
        PDPage page = new PDPage();
        doc.addPage(page);
        try (PDPageContentStream content = new PDPageContentStream(doc, page)) {
            content.beginText();
            content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
            content.setRenderingMode(mode);
            content.newLineAtOffset(72, 700);
            content.showText(text);
            content.endText();
        }
    }
}
