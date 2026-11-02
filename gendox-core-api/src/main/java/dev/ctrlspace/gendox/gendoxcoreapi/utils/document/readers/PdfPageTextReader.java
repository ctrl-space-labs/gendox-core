package dev.ctrlspace.gendox.gendoxcoreapi.utils.document.readers;

import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.documents.PageText;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.graphics.state.RenderingMode;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.text.TextPosition;

import java.io.IOException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

/**
 * Reads the text of each PDF page, counting how much of it is drawn. A scanner's OCR layer is text in
 * render mode 3 (neither filled nor stroked), so a scanned page can have plenty of text and none of it visible.
 */
public final class PdfPageTextReader {

    private PdfPageTextReader() {
    }

    /** One entry per page, in page order, including pages with no text. */
    public static List<PageText> read(Path pdfPath) throws IOException {
        List<PageText> pages = new ArrayList<>();
        try (PDDocument doc = Loader.loadPDF(pdfPath.toFile())) {
            VisibleCountingStripper stripper = new VisibleCountingStripper();
            for (int i = 1; i <= doc.getNumberOfPages(); i++) {
                stripper.setStartPage(i);
                stripper.setEndPage(i);
                stripper.visibleCharacters = 0;
                String text = stripper.getText(doc).replace("\u0000", "").strip();
                pages.add(new PageText(text, stripper.visibleCharacters));
            }
        }
        return pages;
    }

    private static final class VisibleCountingStripper extends PDFTextStripper {

        private int visibleCharacters;

        @Override
        protected void processTextPosition(TextPosition text) {
            RenderingMode mode = getGraphicsState().getTextState().getRenderingMode();
            if ((mode.isFill() || mode.isStroke()) && text.getUnicode() != null) {
                visibleCharacters += text.getUnicode().strip().length();
            }
            super.processTextPosition(text);
        }
    }
}
