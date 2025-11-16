package dev.ctrlspace.gendox.gendoxcoreapi.services;

import com.fasterxml.uuid.Generators;
import com.vladsch.flexmark.html2md.converter.FlexmarkHtmlConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.documents.DocPageToImageOptions;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.ImageUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.ObservabilityTags;
import io.micrometer.observation.annotation.Observed;
import jakarta.annotation.Nullable;
import jakarta.annotation.PostConstruct;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.docx4j.Docx4J;
import org.docx4j.convert.out.HTMLSettings;
import org.docx4j.fonts.PhysicalFonts;
import org.docx4j.model.images.AbstractWordXmlPicture;
import org.docx4j.model.images.ConversionImageHandler;
import org.docx4j.openpackaging.exceptions.Docx4JException;
import org.docx4j.openpackaging.packages.WordprocessingMLPackage;
import org.docx4j.openpackaging.parts.WordprocessingML.BinaryPart;
import org.docx4j.relationships.Relationship;
import org.jetbrains.annotations.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.document.MetadataMode;
import org.springframework.ai.reader.pdf.PagePdfDocumentReader;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

@Service
public class DownloadService {

    Logger logger = LoggerFactory.getLogger(DownloadService.class);


    private ResourceLoader resourceLoader;
    private String pageSeparatorTemplate;
    private ImageUtils imageUtils;



    @Autowired
    public DownloadService(ResourceLoader resourceLoader,
                           ImageUtils imageUtils,
                           @Value("${gendox.documents.page-separator-template}") String pageSeparatorTemplate
                            ) {
        this.resourceLoader = resourceLoader;
        this.imageUtils = imageUtils;
        this.pageSeparatorTemplate = pageSeparatorTemplate;

    }

    @PostConstruct
    public void cleanTempDirOnStartup() throws IOException {
        Path sysTemp = Paths.get(System.getProperty("java.io.tmpdir")).toAbsolutePath().normalize();
        Path tempDir = getTempDir();

        try {
            if (!tempDir.startsWith(sysTemp)) {
                logger.warn("Skipping cleanup: resolved tempDir {} is outside system temp {}", tempDir, sysTemp);
                return;
            }

            if (Files.exists(tempDir)) {
                try (Stream<Path> walk = Files.walk(tempDir)) {
                    walk.filter(p -> !p.equals(tempDir))
                            .sorted(Comparator.reverseOrder())
                            .forEach(p -> {
                                try {
                                    Files.deleteIfExists(p);
                                } catch (IOException e) {
                                    logger.warn("Failed to delete {}: {}", p, e.getMessage());
                                }
                            });
                }
            }

            Files.createDirectories(tempDir);
            logger.info("Cleaned temp dir {}", tempDir);
        } catch (IOException e) {
            logger.error("Failed to clean temp dir {}: {}", tempDir, e.getMessage());
        }
    }

    public byte[] readDocumentBytes(String documentUrl) throws GendoxException, IOException {
        Resource resource = openResource(documentUrl);
        try (InputStream in = resource.getInputStream()) {
            return in.readAllBytes();
        }
    }

    public Path getTempDir() throws IOException {
        Path tempDir = Paths.get(System.getProperty("java.io.tmpdir"), "gendox-docs");
        Files.createDirectories(tempDir);
        return tempDir;
    }

    /**
     * Downloads the document from the given URL to a temporary file.
     * If the file already exists, it returns the existing path.
     * Otherwise, it copies the content from the resource to the temp file.
     *
     * @param documentUrl the URL of the document to download
     * @param prefix an optional prefix to add to the temp file name
     * @return
     * @throws GendoxException
     * @throws IOException
     */
    public Path downloadToTemp(String documentUrl, @Nullable String prefix) throws GendoxException, IOException {
        Resource resource = openResource(documentUrl);

        if (prefix == null) {
            prefix = "";
        }

        String fullPath = resource.getFilename();
        String fileName = StringUtils.getFilename(fullPath);
        if (fileName == null || fileName.isBlank()) {
            fileName = Generators.timeBasedEpochGenerator().generate() + ".tmp";
        }

        // append prefix
        fileName =  prefix + "-" + fileName;

        Path tempDir = getTempDir();
        Files.createDirectories(tempDir);

        Path tempFile = tempDir.resolve(fileName);
        Files.createDirectories(tempDir);

        if (Files.exists(tempFile)) {
            logger.debug("Temp file already exists: {}", tempFile.toString());
            return tempFile;
        }


        try (InputStream in = resource.getInputStream()) {
            logger.debug("Downloading temp file to: {}", tempFile.toString());
            Files.copy(in, tempFile, StandardCopyOption.REPLACE_EXISTING);
        }

        logger.debug("Temp file copied to: {} | file size: {}", tempFile.toString(), tempFile.toFile().length());
        return tempFile;
    }

    public String readDocumentContent(String documentUrl) throws GendoxException, IOException {
        // Get the Resource from openResource
        Resource resource = openResource(documentUrl);

        String fileExtension = getFileExtension(documentUrl, resource);

        // TODO @Giannis check if the API Integrations remote url, breaks the logic of file extentions
        if (isTextFile(fileExtension)) {
            // Handle text files
            return readTxtFileContent(resource);
        } else if (isPdfFile(fileExtension)) {
            // Handle PDF files
            return readPdfContent(resource);
        } else if (isDocxFile(fileExtension)) {
            return readDocxContent(resource);
        } else {
            throw new GendoxException("ERROR_UNSUPPORTED_FILE_TYPE", "Unsupported file type: " + fileExtension, HttpStatus.BAD_REQUEST);
        }

    }

    /**
     * It "prints" the document pages to Base64-encoded JPEG images.
     *
     * TODO: If images exist in page, get bounding boxes extract images (see {@link <a href="https://ai.google.dev/gemini-api/docs/image-understanding#object-detection">...</a>})
     * @param documentUrl
     * @return
     * @throws GendoxException
     * @throws IOException
     */
    public List<String> printDocumentPages(String documentUrl, Path filePath, @Nullable DocPageToImageOptions printOptions) throws GendoxException, IOException {
        // Get the Resource from openResource
        Resource resource = openResource(documentUrl);
        String fileExtension = getFileExtension(documentUrl, resource);


        if (printOptions == null) {
            printOptions = DocPageToImageOptions.builder().build();
        }

        // TODO @Giannis check if the API Integrations remote url, breaks the logic of file extentions
        if (isTextFile(fileExtension)) {
            throw new GendoxException("ERROR_UNSUPPORTED_FILE_TYPE", "Document is already in text format. Unsupported file type: " + fileExtension, HttpStatus.BAD_REQUEST);
        } else if (isPdfFile(fileExtension)) {
            List <String> printedPages = pdfToBase64Pages(resource, filePath, printOptions);
            return printedPages;
        } else if (isDocxFile(fileExtension)) {
            throw new GendoxException("ERROR_UNSUPPORTED_FILE_TYPE", "Not Supported yet, file type: " + fileExtension, HttpStatus.BAD_REQUEST);
        } else {
            throw new GendoxException("ERROR_UNSUPPORTED_FILE_TYPE", "Unsupported file type: " + fileExtension, HttpStatus.BAD_REQUEST);
        }

    }

    public Integer countDocumentPages(String documentUrl) throws GendoxException, IOException {
        Resource resource = openResource(documentUrl);

        String fileExtension = getFileExtension(documentUrl, resource);
        if (isTextFile(fileExtension)) {
            throw new GendoxException("ERROR_UNSUPPORTED_FILE_TYPE", "Document is already in text format. Unsupported file type: " + fileExtension, HttpStatus.BAD_REQUEST);
        } else if (isPdfFile(fileExtension)) {

            try (PDDocument doc = Loader.loadPDF(resource.getContentAsByteArray())) {
                return doc.getNumberOfPages();
            }

        } else if (isDocxFile(fileExtension)) {
            try (InputStream in = resource.getInputStream()) {
                WordprocessingMLPackage pkg = WordprocessingMLPackage.load(in);
                return pkg.getMainDocumentPart().getContent().size();
            } catch (Docx4JException e) {
                throw new RuntimeException(e);
            }
        } else {
            throw new GendoxException("ERROR_UNSUPPORTED_FILE_TYPE", "Unsupported file type: " + fileExtension, HttpStatus.BAD_REQUEST);
        }
    }

    public boolean isPdfUrl(String documentUrl) throws GendoxException {
        String extension = getFileExtension(documentUrl);
        if (extension == null) {
            Resource resource = openResource(documentUrl);
            extension = getFileExtension(resource.getFilename());
        }
        return isPdfFile(extension);
    }


    private @NotNull String getFileExtension(String documentUrl, Resource resource) throws GendoxException {
        String fileExtension = getFileExtension(documentUrl);
        if (fileExtension == null) {
            fileExtension = getFileExtension(resource.getFilename());
        }
        if (fileExtension == null) {
            throw new GendoxException("ERROR_UNKNOWN_FILE_TYPE", "Unknown file type: " + fileExtension, HttpStatus.BAD_REQUEST);
        }
        return fileExtension;
    }

    @Observed(name = "DownloadService.readTxtFileContent",
            contextualName = "DownloadService#readTxtFileContent",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_INFO,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "false"
            })
    private String readTxtFileContent(Resource fileResource) throws IOException {

        StringBuilder fileContent = new StringBuilder();
        // Try-with-resources to ensure InputStream is closed after use
        try (
                InputStream inputStream = fileResource.getInputStream();
                BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream))
        ) {
            String line;
            while ((line = reader.readLine()) != null) {
                fileContent.append(line).append("\n");
            }
        }

        return fileContent.toString();
    }


    public Resource openResource(String fileUrl) throws GendoxException {
        try {
            return resourceLoader.getResource(fileUrl);
        } catch (Exception e) {
            throw new GendoxException("ERROR_OPENING_RESOURCE", "Error opening resource: " + fileUrl, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Observed(name = "DownloadService.readPdfContent",
            contextualName = "DownloadService#readPdfContent",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_INFO,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "false"
            })
    private String readPdfContent(Resource fileResource) throws IOException {
        // Use the PagePdfDocumentReader to read the PDF content
        var pages = new PagePdfDocumentReader(fileResource).get();

        // Concatenate all pages' content
        StringBuilder allPagesContent = new StringBuilder();
        pages.stream()
                .filter(page -> page.getFormattedContent(MetadataMode.NONE).length() > 10)
                .forEach(page -> allPagesContent
                        .append(String.format(pageSeparatorTemplate, page.getMetadata().get("page_number")))
                        .append(page.getFormattedContent(MetadataMode.NONE)));

        return allPagesContent.toString().replace("\u0000", "");
    }

    /**
     * @param fileResource any Spring {@link Resource} (MultipartFile, class-path, S3, etc.)
     * @return Markdown with inlined <code>data:image/…;base64,…</code> pictures
     */
    public String readDocxContent(Resource fileResource) throws IOException {

        PhysicalFonts.setRegex(".*(calibri|cambria|arial|times|cour|symbol|wing).*");

        try (InputStream in = fileResource.getInputStream()) {
            WordprocessingMLPackage pkg = WordprocessingMLPackage.load(in);

            HTMLSettings htmlSettings = Docx4J.createHTMLSettings();
            htmlSettings.setOpcPackage(pkg);
            htmlSettings.setImageHandler(new ConversionImageHandler() {
                @Override
                public String handleImage(AbstractWordXmlPicture abstractWordXmlPicture, Relationship relationship, BinaryPart binaryPart) throws Docx4JException {
                    if (binaryPart == null) return relationship == null ? null : relationship.getTarget();
                    try (ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
                        binaryPart.writeDataToOutputStream(bos);
                        String mime = binaryPart.getContentType();           // e.g. image/png
                        String b64  = Base64.getEncoder()
                                .encodeToString(bos.toByteArray());
                        return "data:" + mime + ";base64," + b64;      // <-- returned to exporter
                    } catch (IOException ex) {
                        throw new Docx4JException("Base64 image failure", ex);
                    }
                }
            });


            ByteArrayOutputStream htmlOut = new ByteArrayOutputStream();
            Docx4J.toHTML(htmlSettings, htmlOut, Docx4J.FLAG_EXPORT_PREFER_XSL);
            String html = htmlOut.toString(StandardCharsets.UTF_8);

            // TODO: better HTML to Markdown conversion is needed
            FlexmarkHtmlConverter converter = FlexmarkHtmlConverter.builder().build();
            return converter.convert(html);
        } catch (Docx4JException e) {
            throw new RuntimeException(e);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Converts PDF pages to Base64-encoded JPEG images.
     * WARNING: Processing more than 100 pages may cause Out-Of-Memory issues.
     *
     * @param fileResource
     * @param options
     * @return
     * @throws GendoxException
     * @throws IOException
     */
    public List<String> pdfToBase64Pages(Resource fileResource, Path filePath, DocPageToImageOptions options) throws GendoxException, IOException {
        List<String> allPagesContent = new ArrayList<>();

        try (PDDocument doc = Loader.loadPDF(filePath.toFile())) {

            options = options.applyDefaults(doc.getNumberOfPages());

            PDFRenderer renderer = new PDFRenderer(doc);

            for (int i = options.getPageFrom(); i <= options.getPageTo() ; i++) {

                BufferedImage img;

                if (options.getRenderDPI() != null) {
                    // legacy path (bigger memory): render with DPI
                    img = renderer.renderImageWithDPI(i, options.getRenderDPI(), ImageType.RGB);
                    // then optionally scale down
                    img = imageUtils.scaleToMinSide(img, options.getMinSide());
                } else {
                    // new path (preferred): render directly at the pixel size you need
                    float scale = imageUtils.computeScaleForMinSide(doc.getPage(i), options.getMinSide());
                    img = renderer.renderImage(i, scale, ImageType.RGB);
                    int w = img.getWidth();
                    int h = img.getHeight();
                    int minSide = Math.min(w, h);

                    if (minSide > 768) {
                        logger.warn(
                                "Doc: {} | Page {}: shortest side is {}px (> 768). You may want to lower the render scale.",
                                fileResource.getFilename(),  i, minSide
                        );
                    }
                }

                BufferedImage enhanced = imageUtils.enhanceForOCR(img, options.getImageContrast(), options.getImageBrightness());
                String dataUri = imageUtils.toBase64Jpeg(enhanced, options.getJpegQ());
                img.flush();
                enhanced.flush();


                logger.debug("Page " + (i + 1) + ": " + dataUri.length() + " bytes");
                allPagesContent.add(dataUri);
            }
        }

        return allPagesContent;
    }



    public List<String> readDocumentAdvancedOCR(List<String> docBase64Pages) throws GendoxException{

        return null;

    }


    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex >= 0) {
            return filename.substring(lastDotIndex);
        }
        return null;
    }

    private boolean isTextFile(String extension) {
        return List.of(".txt", ".md", ".csv", ".log").contains(extension);
    }

    private boolean isPdfFile(String extension) {
        return ".pdf".equals(extension);
    }

    private boolean isDocxFile(String extension) {
        return ".docx".equals(extension);
    }
}
