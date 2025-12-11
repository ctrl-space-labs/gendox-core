package dev.ctrlspace.gendox.gendoxcoreapi.utils.document.readers;

import com.vladsch.flexmark.html2md.converter.FlexmarkHtmlConverter;
import org.apache.poi.hwpf.HWPFDocument;
import org.apache.poi.hwpf.converter.PicturesManager;
import org.apache.poi.hwpf.converter.WordToHtmlConverter;
import org.apache.poi.hwpf.usermodel.PictureType;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.w3c.dom.Document;

import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 *  Component to read legacy .doc (Word 97-2003) files and convert their content to Markdown.
 *  Images are inlined as data:image/…;base64,… URIs.
 */
@Component
public class DocFileReader {

    /**
     * Reads a legacy .doc (Word 97-2003) file and returns Markdown.
     * Images are inlined as data:image/...;base64,... URIs.
     */
    public String readDocContent(Resource fileResource) throws IOException {

        try (InputStream in = fileResource.getInputStream()) {

            HWPFDocument wordDoc = new HWPFDocument(in);

            // Build an empty DOM document to hold the HTML
            Document htmlDoc = DocumentBuilderFactory
                    .newInstance()
                    .newDocumentBuilder()
                    .newDocument();

            WordToHtmlConverter wordToHtmlConverter = new WordToHtmlConverter(htmlDoc);

            // Inline images as data: URIs, similar to your DocxFileReader
            wordToHtmlConverter.setPicturesManager(new PicturesManager() {
                @Override
                public String savePicture(byte[] content,
                                          PictureType pictureType,
                                          String suggestedName,
                                          float widthInches,
                                          float heightInches) {

                    String mime = pictureType.getMime(); // e.g. image/jpeg, image/png
                    String b64 = Base64.getEncoder().encodeToString(content);
                    return "data:" + mime + ";base64," + b64;
                }
            });

            // Process the .doc into HTML DOM
            wordToHtmlConverter.processDocument(wordDoc);
            Document htmlDocument = wordToHtmlConverter.getDocument();

            // Serialize HTML DOM to String
            String html = domToString(htmlDocument);

            // Convert HTML -> Markdown (same as your DocxFileReader)
            FlexmarkHtmlConverter converter = FlexmarkHtmlConverter.builder().build();
            return converter.convert(html);

        } catch (ParserConfigurationException | TransformerException e) {
            // Wrap however you like; using RuntimeException here for brevity
            throw new RuntimeException("Failed to convert .doc to HTML/Markdown", e);
        }
    }

    private String domToString(Document doc) throws TransformerException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Transformer transformer = TransformerFactory.newInstance().newTransformer();
        transformer.setOutputProperty(OutputKeys.METHOD, "html");
        transformer.setOutputProperty(OutputKeys.ENCODING, "UTF-8");
        transformer.setOutputProperty(OutputKeys.INDENT, "no");
        transformer.transform(new DOMSource(doc), new StreamResult(out));
        return out.toString(StandardCharsets.UTF_8);
    }
}

