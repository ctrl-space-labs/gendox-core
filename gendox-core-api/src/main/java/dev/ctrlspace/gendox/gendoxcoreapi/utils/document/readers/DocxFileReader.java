package dev.ctrlspace.gendox.gendoxcoreapi.utils.document.readers;

import com.vladsch.flexmark.html2md.converter.FlexmarkHtmlConverter;
import jakarta.xml.bind.JAXBElement;
import org.docx4j.Docx4J;
import org.docx4j.convert.out.HTMLSettings;
import org.docx4j.fonts.PhysicalFonts;
import org.docx4j.model.images.AbstractWordXmlPicture;
import org.docx4j.model.images.ConversionImageHandler;
import org.docx4j.openpackaging.exceptions.Docx4JException;
import org.docx4j.openpackaging.packages.WordprocessingMLPackage;
import org.docx4j.openpackaging.parts.WordprocessingML.BinaryPart;
import org.docx4j.relationships.Relationship;
import org.docx4j.wml.Br;
import org.docx4j.wml.P;
import org.docx4j.wml.R;
import org.docx4j.wml.STBrType;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

/**
 * Component to read .docx (Word 2007+) files and convert their content to Markdown.
 * Images are inlined as data:image/…;base64,… URIs.
 */
@Component
public class DocxFileReader {

    /**
     * Converts the full document to Markdown with inlined base64 images.
     *
     * @param fileResource any Spring {@link Resource} (MultipartFile, class-path, S3, etc.)
     * @return Markdown with inlined <code>data:image/…;base64,…</code> pictures
     */
    public String readDocxContent(Resource fileResource) throws IOException {
        PhysicalFonts.setRegex(".*(calibri|cambria|arial|times|cour|symbol|wing).*");
        try (InputStream in = fileResource.getInputStream()) {
            WordprocessingMLPackage pkg = WordprocessingMLPackage.load(in);
            return convertToMarkdown(pkg);
        } catch (Docx4JException | RuntimeException e) {
            throw new RuntimeException(e);
        }
    }


    // ── Private helpers ────────────────────────────────────────────────────────

    /**
     * Converts whatever is currently in {@code pkg}'s main document part to Markdown.
     * This is the single implementation shared by {@link #readDocxContent}
     */
    private String convertToMarkdown(WordprocessingMLPackage pkg) throws Docx4JException, IOException {
        HTMLSettings htmlSettings = Docx4J.createHTMLSettings();
        htmlSettings.setOpcPackage(pkg);
        htmlSettings.setImageHandler(new ConversionImageHandler() {
            @Override
            public String handleImage(AbstractWordXmlPicture abstractWordXmlPicture, Relationship relationship, BinaryPart binaryPart) throws Docx4JException {
                if (binaryPart == null) return relationship == null ? null : relationship.getTarget();
                try (ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
                    binaryPart.writeDataToOutputStream(bos);
                    String mime = binaryPart.getContentType();
                    String b64  = Base64.getEncoder().encodeToString(bos.toByteArray());
                    return "data:" + mime + ";base64," + b64;
                } catch (IOException ex) {
                    throw new Docx4JException("Base64 image failure", ex);
                }
            }
        });

        ByteArrayOutputStream htmlOut = new ByteArrayOutputStream();
        Docx4J.toHTML(htmlSettings, htmlOut, Docx4J.FLAG_EXPORT_PREFER_XSL);
        String html = htmlOut.toString(StandardCharsets.UTF_8);

        // TODO: better HTML-to-Markdown conversion is needed
        return FlexmarkHtmlConverter.builder().build().convert(html);
    }
}
