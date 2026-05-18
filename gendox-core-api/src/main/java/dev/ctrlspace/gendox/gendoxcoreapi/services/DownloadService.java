package dev.ctrlspace.gendox.gendoxcoreapi.services;

import com.fasterxml.uuid.Generators;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.documents.DocPageToImageOptions;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.ImageUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.ObservabilityTags;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.document.WordToPdfConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.document.readers.DocFileReader;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.document.readers.DocxFileReader;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.document.readers.ExcelFileReader;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.document.readers.PptxFileReader;
import org.springframework.core.io.FileSystemResource;
import io.micrometer.observation.annotation.Observed;
import jakarta.annotation.Nullable;
import jakarta.annotation.PostConstruct;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xslf.usermodel.XMLSlideShow;
import org.apache.poi.xslf.usermodel.XSLFSlide;
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

import java.awt.Dimension;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;
import java.util.stream.Stream;

@Service
public class DownloadService {

    private final ExcelFileReader excelFileReader;
    private final DocxFileReader docxFileReader;
    private final DocFileReader docFileReader;
    private final PptxFileReader pptxFileReader;
    private final WordToPdfConverter wordToPdfConverter;
    Logger logger = LoggerFactory.getLogger(DownloadService.class);


    private ResourceLoader resourceLoader;
    private String pageSeparatorTemplate;
    private ImageUtils imageUtils;



    @Autowired
    public DownloadService(ResourceLoader resourceLoader,
                           ImageUtils imageUtils,
                           @Value("${gendox.documents.page-separator-template}") String pageSeparatorTemplate,
                           ExcelFileReader excelFileReader,
                           DocxFileReader docxFileReader,
                           DocFileReader docFileReader,
                           PptxFileReader pptxFileReader,
                           WordToPdfConverter wordToPdfConverter) {
        this.resourceLoader = resourceLoader;
        this.imageUtils = imageUtils;
        this.pageSeparatorTemplate = pageSeparatorTemplate;
        this.excelFileReader = excelFileReader;
        this.docxFileReader = docxFileReader;
        this.docFileReader = docFileReader;
        this.pptxFileReader = pptxFileReader;
        this.wordToPdfConverter = wordToPdfConverter;
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

        String fullPath = resource.getFilename();
        String fileName = StringUtils.getFilename(fullPath);
        if (fileName == null || fileName.isBlank()) {
            fileName = Generators.timeBasedEpochGenerator().generate() + ".tmp";
        }

        if (StringUtils.hasText(prefix)) {
            fileName = prefix + "-" + fileName;
        }

        Path tempDir = getTempDir();
        Path tempFile = tempDir.resolve(fileName);

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
            return readTxtFileContent(resource);
        } else if (isPdfFile(fileExtension)) {
            return readPdfContent(resource);
        } else if (isDocxFile(fileExtension)) {
            return readDocxContent(resource);
        } else if (isDocFile(fileExtension)) {
            return readDocContent(resource);
        } else if (isXlsFile(fileExtension) || isXlsxFile(fileExtension)) {
            return readExcelContent(resource);
        } else if (isImageFile(fileExtension)) {
            throw new GendoxException("ERROR_IMAGE_FILE_TYPE", "File type " + fileExtension + " is an image and cannot be converted to text.", HttpStatus.UNSUPPORTED_MEDIA_TYPE );
        } else {
            throw new GendoxException("ERROR_UNSUPPORTED_FILE_TYPE", "Unsupported file type: " + fileExtension, HttpStatus.BAD_REQUEST);
        }

    }

    public String readDocumentImageToBase64(String documentUrl) throws GendoxException, IOException {
        Resource resource = openResource(documentUrl);

        String fileExtension = getFileExtension(documentUrl, resource);

        if (!isImageFile(fileExtension)) {
            throw new GendoxException(
                    "ERROR_NOT_IMAGE_FILE_TYPE",
                    "File type " + fileExtension + " is not an image and cannot be converted to Base64.",
                    HttpStatus.UNSUPPORTED_MEDIA_TYPE
            );
        }

        return imageUtils.toBase64(resource, fileExtension);
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

        if (isTextFile(fileExtension)) {
            throw new GendoxException("ERROR_UNSUPPORTED_FILE_TYPE", "Document is already in text format. Unsupported file type: " + fileExtension, HttpStatus.BAD_REQUEST);
        } else if (isPdfFile(fileExtension)) {
            return pdfToBase64Pages(resolvePdfPath(documentUrl, resource, filePath), printOptions);
        } else if (isDocxFile(fileExtension)) {
            return pdfToBase64Pages(resolveDocxAsPdf(documentUrl, filePath), printOptions);
        } else if (isPptxFile(fileExtension)) {
            return pptxToBase64Pages(resolveResource(resource, filePath), printOptions);
        } else {
            throw new GendoxException("ERROR_UNSUPPORTED_FILE_TYPE", "Unsupported file type for page printing: " + fileExtension, HttpStatus.BAD_REQUEST);
        }

    }

    public Integer countDocumentPages(String documentUrl) throws GendoxException, IOException {
        Resource resource = openResource(documentUrl);
        String fileExtension = getFileExtension(documentUrl, resource);

        if (isPdfFile(fileExtension)) {
            try (PDDocument doc = Loader.loadPDF(resource.getContentAsByteArray())) {
                return doc.getNumberOfPages();
            }
        } else if (isDocxFile(fileExtension)) {
            Path pdfPath = resolveDocxAsPdf(documentUrl, null);
            try (PDDocument doc = Loader.loadPDF(pdfPath.toFile())) {
                return doc.getNumberOfPages();
            }
        } else if (isDocFile(fileExtension)) {
            return 1;
        } else if (isPptxFile(fileExtension)) {
            return pptxFileReader.countSlides(resource);
        } else if (isXlsFile(fileExtension) || isXlsxFile(fileExtension)) {
            return excelFileReader.countSheets(resource);
        } else if (isTextFile(fileExtension)) {
            return 1;
        } else {
            throw new GendoxException("ERROR_UNSUPPORTED_FILE_TYPE", "Unsupported file type for page counting: " + fileExtension, HttpStatus.BAD_REQUEST);
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


    public @NotNull String getFileExtension(String documentUrl, Resource resource) throws GendoxException {
        String fileExtension = getFileExtension(documentUrl);
        if (fileExtension == null) {
            fileExtension = getFileExtension(resource.getFilename());
        }
        if (fileExtension == null) {
            throw new GendoxException("ERROR_UNKNOWN_FILE_TYPE", "Unknown file type for: " + documentUrl, HttpStatus.BAD_REQUEST);
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
        return fileResource.getContentAsString(StandardCharsets.UTF_8);
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

        return docxFileReader.readDocxContent(fileResource);
    }

    public String readDocContent(Resource fileResource) throws IOException {

        return docFileReader.readDocContent(fileResource);
    }

    private String readExcelContent(Resource resource) throws GendoxException {
        return excelFileReader.readExcelContent(resource);

    }

    /**
     * Converts PDF pages to Base64-encoded JPEG images.
     * WARNING: Processing more than 100 pages may cause Out-Of-Memory issues.
     *
     * @param filePath path to the local PDF file (authoritative input for all I/O)
     * @param options  rendering options
     * @return list of Base64-encoded JPEG strings, one per page in the requested range
     * @throws GendoxException
     * @throws IOException
     */
    public List<String> pdfToBase64Pages(Path filePath, DocPageToImageOptions options) throws GendoxException, IOException {
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
                                filePath.getFileName(), i, minSide
                        );
                    }
                }

                BufferedImage enhanced = imageUtils.enhanceForOCR(img, options.getImageContrast(), options.getImageBrightness());
                String dataUri = imageUtils.toBase64Jpeg(enhanced, options.getJpegQ());
                img.flush();
                enhanced.flush();


                logger.debug("Page {}: {} bytes", i + 1, dataUri.length());
                allPagesContent.add(dataUri);
            }
        }

        return allPagesContent;
    }



    public List<String> readDocumentAdvancedOCR(List<String> docBase64Pages) throws GendoxException{

        return null;

    }

    /**
     * Returns the text content of a document as one element per logical page / sheet.
     * Supported: .pdf, .docx, .pptx, .doc, .xls, .xlsx, .txt, .md, .csv, .log
     * Not applicable for images (use readDocumentImageToBase64).
     *
     * <p>{@code .pdf} and {@code .docx} text use {@link #readPdfPagesAsList} (DOCX via FOP-generated PDF,
     * aligned with {@link #printDocumentPages} images). {@code .pptx} text is extracted per slide via POI.
     *
     * @param filePath optional local copy from {@link #downloadToTemp} (same as {@link #printDocumentPages})
     */
    public List<String> readDocumentPages(String documentUrl) throws GendoxException, IOException {
        return readDocumentPages(documentUrl, null);
    }

    public List<String> readDocumentPages(String documentUrl, @Nullable Path filePath) throws GendoxException, IOException {
        Resource resource = openResource(documentUrl);
        String ext = getFileExtension(documentUrl, resource);

        if (isPdfFile(ext)) {
            return readPdfPagesAsList(resolvePdfPath(documentUrl, resource, filePath));
        } else if (isDocxFile(ext)) {
            return readPdfPagesAsList(resolveDocxAsPdf(documentUrl, filePath));
        } else if (isPptxFile(ext)) {
            return pptxFileReader.readPptxPages(resolveResource(resource, filePath));
        } else if (isDocFile(ext)) {
            return List.of(readDocContent(resolveResource(resource, filePath)));
        } else if (isXlsFile(ext) || isXlsxFile(ext)) {
            Resource excelResource = resolveResource(resource, filePath);
            int sheetCount = excelFileReader.countSheets(excelResource);
            List<String> pages = new ArrayList<>();
            for (int i = 0; i < sheetCount; i++) {
                pages.add(excelFileReader.readSheetContent(excelResource, i));
            }
            return pages;
        } else if (isTextFile(ext)) {
            return List.of(readTxtFileContent(resolveResource(resource, filePath)));
        } else {
            throw new GendoxException("ERROR_UNSUPPORTED_FILE_TYPE", "readDocumentPages not supported for file type: " + ext, HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Resolves a local PDF path. Uses {@code pdfPath} when it already points to an existing file
     * (e.g. digitization batch temp file); otherwise downloads from {@code documentUrl}.
     */
    private Path resolvePdfPath(String documentUrl, Resource resource, @Nullable Path pdfPath) throws GendoxException, IOException {
        if (pdfPath != null && Files.exists(pdfPath)) {
            return pdfPath;
        }
        if (resource instanceof FileSystemResource fsr) {
            File file = fsr.getFile();
            if (file.exists()) {
                return file.toPath();
            }
        }
        return downloadToTemp(documentUrl, null);
    }

    /**
     * Uses the local {@code filePath} when present (e.g. digitization batch temp file); otherwise the remote resource.
     */
    private Resource resolveResource(Resource resource, @Nullable Path filePath) {
        if (filePath != null && Files.exists(filePath)) {
            return new FileSystemResource(filePath.toFile());
        }
        return resource;
    }

    /**
     * Converts a DOCX to a cached PDF. Uses {@code docxPath} when it already points to a local file
     * (e.g. digitization batch temp file); otherwise downloads from {@code documentUrl}.
     */
    private Path resolveDocxAsPdf(String documentUrl, @Nullable Path docxPath) throws GendoxException, IOException {
        Path localDocx = (docxPath != null && Files.exists(docxPath))
                ? docxPath
                : downloadToTemp(documentUrl, null);
        return wordToPdfConverter.convertDocxToPdf(localDocx, documentUrl, getTempDir());
    }

    /**
     * Returns one text string per PDF page index, aligned with {@link #pdfToBase64Pages} and
     * {@link PDDocument#getNumberOfPages()} (including pages with little or no extractable text).
     */
    private List<String> readPdfPagesAsList(Path pdfPath) throws IOException {
        List<String> pages = new ArrayList<>();
        try (PDDocument doc = Loader.loadPDF(pdfPath.toFile())) {
            PDFTextStripper stripper = new PDFTextStripper();
            int total = doc.getNumberOfPages();
            for (int i = 1; i <= total; i++) {
                stripper.setStartPage(i);
                stripper.setEndPage(i);
                pages.add(stripper.getText(doc).replace("\u0000", "").strip());
            }
        }
        return pages;
    }

    /**
     * Renders each PPTX slide to a Base64-encoded JPEG image.
     */
    private List<String> pptxToBase64Pages(Resource resource, DocPageToImageOptions options) throws GendoxException, IOException {
        List<String> pages = new ArrayList<>();

        try (InputStream in = resource.getInputStream();
             XMLSlideShow pptx = new XMLSlideShow(in)) {

            if (options == null) {
                options = DocPageToImageOptions.builder().build();
            }
            options = options.applyDefaults(pptx.getSlides().size());

            Dimension dim = pptx.getPageSize();
            List<XSLFSlide> slides = pptx.getSlides();

            for (int i = options.getPageFrom(); i <= options.getPageTo(); i++) {
                XSLFSlide slide = slides.get(i);

                double scale = options.getMinSide() > 0
                        ? options.getMinSide() / (double) Math.min(dim.width, dim.height)
                        : 1.0;
                int w = (int) (dim.width * scale);
                int h = (int) (dim.height * scale);

                BufferedImage img = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
                Graphics2D g = img.createGraphics();
                g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
                g.scale(scale, scale);
                slide.draw(g);
                g.dispose();

                BufferedImage enhanced = imageUtils.enhanceForOCR(img, options.getImageContrast(), options.getImageBrightness());
                pages.add(imageUtils.toBase64Jpeg(enhanced, options.getJpegQ()));
                img.flush();
                enhanced.flush();
            }
        }

        return pages;
    }

    public String getFileExtension(String filename) {
        if (filename == null) return null;
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex >= 0) {
            return filename.substring(lastDotIndex).toLowerCase();
        }
        return null;
    }

    public boolean isTextFile(String extension) {
        return extension != null && Set.of(".txt", ".md", ".csv", ".log").contains(extension);
    }

    public boolean isPdfFile(String extension) {
        return ".pdf".equals(extension);
    }

    public boolean isDocxFile(String extension) {
        return ".docx".equals(extension);
    }

    public boolean isDocFile(String extension) {
        return ".doc".equals(extension);
    }

    public boolean isPptxFile(String extension) {
        return ".pptx".equals(extension);
    }

    public boolean isXlsFile(String fileExtension) {
        return ".xls".equals(fileExtension);
    }

    public boolean isXlsxFile(String extension) {
        return ".xlsx".equals(extension);
    }

    /**
     * Returns true for formats that have multiple pages and support both
     * rendered-image and text extraction per page.
     */
    public boolean isPagedFormat(String extension) {
        return isPdfFile(extension) || isDocxFile(extension) || isDocFile(extension) || isPptxFile(extension);
    }

    /**
     * Returns true for formats where text can be extracted page-by-page
     * but image rendering is not meaningful (flat text, spreadsheets).
     */
    public boolean isTextExtractable(String extension) {
        return isTextFile(extension) || isXlsFile(extension) || isXlsxFile(extension);
    }

    public boolean isImageFile(String extension) {
        return extension != null && Set.of(".jpg", ".jpeg", ".png", ".bmp", ".gif", ".tif", ".tiff", ".webp", ".avif", ".heic", ".heif", ".jxl", ".ico", ".svg")
                .contains(extension);
    }


}
