package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.documents.DocPageToImageOptions;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.ImageUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.document.WordToPdfConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.document.readers.DocFileReader;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.document.readers.DocxFileReader;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.document.readers.ExcelFileReader;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.document.readers.PptxFileReader;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.cos.COSName;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDResources;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.DefaultResourceLoader;

import javax.imageio.ImageIO;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import java.util.List;
import java.util.Locale;

import static org.junit.jupiter.api.Assumptions.assumeTrue;
import static org.mockito.Mockito.mock;

/**
 * Manual tool, not a regular test: exports PDF pages through {@link DownloadService#pdfToBase64Pages}
 * as image files, so different render options can be compared by eye.
 * <p>
 * Edit the settings below and run {@link #exportPages()} from the IDE. For every PDF, every page is
 * exported once per entry in {@link #OPTIONS}, plus the page's embedded image unchanged ("original"),
 * as the reference to compare against. PDFs that are not on this machine are skipped, so the test is
 * skipped on CI.
 */
class PdfPageImageExportTest {

    // ---- Settings: edit these, then run exportPages() ----

    /** PDFs to export from (absolute paths). Keep local paths out of commits. */
    private static final List<String> PDF_FILES = List.of(
            "/Users/chrissekas/Library/CloudStorage/OneDrive-Personal/ctrl+space/Administration/Clients/Lloyds Register/Digitize 1768-1835/Lloyds Shared Docs/data/all-files/1874-1935/ROS1875-76.compressed.pdf",
            "/Users/chrissekas/Library/CloudStorage/OneDrive-Personal/ctrl+space/Administration/Clients/Lloyds Register/Digitize 1768-1835/Lloyds Shared Docs/data/all-files/1874-1935/ROS1895-96SV.pdf"
    );

    /** Page numbers as a PDF viewer shows them (first page = 1). */
    private static final List<Integer> PAGES = List.of(227, 458);

    /** One export per entry. Page range is set by the test, everything else is used as given. */
    private static final List<DocPageToImageOptions> OPTIONS = List.of(
            // what digitization uses today
            DocPageToImageOptions.builder().minSide(1024).imageSharpen(1f).build(),
            DocPageToImageOptions.builder().minSide(2000).build(),
            // no contrast / brightness change, no sharpening
            DocPageToImageOptions.builder().minSide(2000).imageContrast(1f).imageBrightness(0f).build(),
            // minSide above the scan's size: a scanned page is sent as its original image
            DocPageToImageOptions.builder().minSide(10_000).build(),
            // drawn at 300 DPI; minSide high enough that it is not shrunk afterwards
            DocPageToImageOptions.builder().renderDPI(300f).minSide(10_000).imageContrast(1f).imageBrightness(0f).build()
    );

    /** Where the images go; a relative path resolves against the module directory (gendox-core-api). */
    private static final Path OUT_DIR = Path.of("target/page-exports");

    // ---- end of settings ----

    @Test
    void exportPages() throws Exception {
        List<Path> pdfs = PDF_FILES.stream().map(Path::of).filter(Files::exists).toList();
        assumeTrue(!pdfs.isEmpty(), "None of PDF_FILES exists on this machine");

        Files.createDirectories(OUT_DIR);
        System.out.println("Exporting to " + OUT_DIR.toAbsolutePath());

        DownloadService downloadService = newDownloadService();

        for (Path pdf : pdfs) {
            String bookName = pdf.getFileName().toString().replaceFirst("(?i)\\.pdf$", "");
            int totalPages;
            try (PDDocument doc = Loader.loadPDF(pdf.toFile())) {
                totalPages = doc.getNumberOfPages();
            }

            for (int page : PAGES) {
                if (page < 1 || page > totalPages) {
                    System.out.printf("%s: no page %d (has %d), skipped%n", bookName, page, totalPages);
                    continue;
                }
                String prefix = bookName + String.format(Locale.ROOT, "_p%04d", page);
                exportOriginalImages(pdf, page, prefix);

                for (DocPageToImageOptions base : OPTIONS) {
                    DocPageToImageOptions options = base.toBuilder().pageFrom(page - 1).pageTo(page - 1).build();

                    String dataUri = downloadService.pdfToBase64Pages(pdf, options).getFirst();
                    byte[] image = Base64.getDecoder().decode(dataUri.substring(dataUri.indexOf(',') + 1));
                    String extension = dataUri.startsWith("data:image/png") ? ".png" : ".jpg";
                    write(OUT_DIR.resolve(prefix + "_" + describe(options) + extension), image);
                }
            }
        }
    }

    /** File name part that tells the options apart, e.g. {@code minSide2000_dpinone_c1.15_b-10_s0.00_q0.90}. */
    private static String describe(DocPageToImageOptions o) {
        return String.format(Locale.ROOT, "minSide%d_dpi%s_c%.2f_b%.0f_s%.2f_q%.2f",
                o.getMinSide(),
                o.getRenderDPI() == null ? "none" : String.format(Locale.ROOT, "%.0f", o.getRenderDPI()),
                o.getImageContrast(), o.getImageBrightness(), o.getImageSharpen(), o.getJpegQ());
    }

    /** Saves each image embedded in the page as it is stored in the PDF: JPEG bytes unchanged, anything else as PNG. */
    private static void exportOriginalImages(Path pdf, int page, String prefix) throws IOException {
        try (PDDocument doc = Loader.loadPDF(pdf.toFile())) {
            PDResources resources = doc.getPage(page - 1).getResources();
            if (resources == null) return;

            int n = 0;
            for (COSName name : resources.getXObjectNames()) {
                if (!(resources.getXObject(name) instanceof PDImageXObject image)) continue;

                String suffix = n++ == 0 ? "" : "_" + n;
                if ("jpg".equals(image.getSuffix())) {
                    try (InputStream in = image.getStream().createInputStream(List.of(COSName.DCT_DECODE.getName()))) {
                        write(OUT_DIR.resolve(prefix + "_original" + suffix + ".jpg"), in.readAllBytes());
                    }
                } else {
                    Path target = OUT_DIR.resolve(prefix + "_original" + suffix + ".png");
                    ImageIO.write(image.getImage(), "png", target.toFile());
                    System.out.printf("%s  %dx%d%n", target.getFileName(), image.getWidth(), image.getHeight());
                }
            }
        }
    }

    private static void write(Path target, byte[] image) throws IOException {
        Files.write(target, image);
        var img = ImageIO.read(new ByteArrayInputStream(image));
        System.out.printf("%s  %dx%d  %,d KB%n", target.getFileName(), img.getWidth(), img.getHeight(), image.length / 1024);
    }

    private static DownloadService newDownloadService() {
        ImageUtils imageUtils = new ImageUtils(mock(DownloadService.class));
        return new DownloadService(
                new DefaultResourceLoader(),
                imageUtils,
                "Page %s\n",
                new ExcelFileReader(),
                new DocxFileReader(),
                new DocFileReader(),
                new PptxFileReader(),
                new WordToPdfConverter()
        );
    }
}
