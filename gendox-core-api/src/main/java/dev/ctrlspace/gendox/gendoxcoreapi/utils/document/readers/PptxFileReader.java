package dev.ctrlspace.gendox.gendoxcoreapi.utils.document.readers;

import org.apache.poi.xslf.usermodel.XMLSlideShow;
import org.apache.poi.xslf.usermodel.XSLFGroupShape;
import org.apache.poi.xslf.usermodel.XSLFShape;
import org.apache.poi.xslf.usermodel.XSLFSlide;
import org.apache.poi.xslf.usermodel.XSLFTable;
import org.apache.poi.xslf.usermodel.XSLFTableCell;
import org.apache.poi.xslf.usermodel.XSLFTableRow;
import org.apache.poi.xslf.usermodel.XSLFTextShape;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

/**
 * Reads {@code .pptx} presentation content one slide per list element.
 * Slide indices align with {@link org.apache.poi.xslf.usermodel.XMLSlideShow#getSlides()}
 * and with {@code DownloadService#pptxToBase64Pages} used for digitization images.
 */
@Component
public class PptxFileReader {

    /**
     * Returns extracted text for each slide (0-based order matches slide list and rendered images).
     */
    public List<String> readPptxPages(Resource resource) throws IOException {
        try (InputStream in = resource.getInputStream();
             XMLSlideShow pptx = new XMLSlideShow(in)) {
            List<String> pages = new ArrayList<>();
            for (XSLFSlide slide : pptx.getSlides()) {
                pages.add(extractSlideText(slide));
            }
            return pages.isEmpty() ? List.of("") : pages;
        }
    }

    public int countSlides(Resource resource) throws IOException {
        try (InputStream in = resource.getInputStream();
             XMLSlideShow pptx = new XMLSlideShow(in)) {
            return Math.max(1, pptx.getSlides().size());
        }
    }

    private String extractSlideText(XSLFSlide slide) {
        StringBuilder sb = new StringBuilder();
        extractShapesText(slide.getShapes(), sb);
        return sb.toString().strip();
    }

    private void extractShapesText(List<XSLFShape> shapes, StringBuilder sb) {
        if (shapes == null) {
            return;
        }
        for (XSLFShape shape : shapes) {
            if (shape instanceof XSLFTextShape textShape) {
                appendText(sb, textShape.getText());
            } else if (shape instanceof XSLFTable table) {
                for (XSLFTableRow row : table.getRows()) {
                    for (XSLFTableCell cell : row.getCells()) {
                        appendText(sb, cell.getText());
                    }
                }
            } else if (shape instanceof XSLFGroupShape group) {
                extractShapesText(group.getShapes(), sb);
            }
        }
    }

    private void appendText(StringBuilder sb, String text) {
        if (text == null || text.isBlank()) {
            return;
        }
        if (!sb.isEmpty()) {
            sb.append('\n');
        }
        sb.append(text.strip());
    }
}
