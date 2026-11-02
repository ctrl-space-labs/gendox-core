package dev.ctrlspace.gendox.gendoxcoreapi.utils;


import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DownloadService;
import org.apache.pdfbox.cos.COSName;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.graphics.color.PDColorSpace;
import org.apache.pdfbox.pdmodel.graphics.color.PDDeviceGray;
import org.apache.pdfbox.pdmodel.graphics.color.PDDeviceRGB;
import org.apache.pdfbox.pdmodel.graphics.color.PDICCBased;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.MemoryCacheImageOutputStream;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.awt.image.ConvolveOp;
import java.awt.image.Kernel;
import java.awt.image.RescaleOp;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Base64;
import java.util.List;
import java.util.Set;

@Component
public class ImageUtils {


    private static final Set<COSName> LOSSLESS_FILTERS = Set.of(
            COSName.FLATE_DECODE, COSName.LZW_DECODE, COSName.RUN_LENGTH_DECODE,
            COSName.CCITTFAX_DECODE, COSName.JBIG2_DECODE);

    private final DownloadService downloadService;

    public ImageUtils(@Lazy DownloadService downloadService) {
        this.downloadService = downloadService;
    }

    /**
     *  For OCR preprocessing
     *  Converts a jpeg to a base64 string with a data URI prefix, applying the specified quality (0.0 to 1.0).
     *
     * @param src
     * @param quality
     * @return
     * @throws IOException
     */
    public String toBase64Jpeg(BufferedImage src, float quality) throws IOException {


        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageWriter writer = ImageIO.getImageWritersByFormatName("jpg").next();
        ImageWriteParam param = writer.getDefaultWriteParam();
        param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
        param.setCompressionQuality(quality);

        try (var ios = new MemoryCacheImageOutputStream(baos)) {
            writer.setOutput(ios);
            writer.write(null, new IIOImage(src, null, null), param);
        } finally {
            writer.dispose();
        }
        return "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(baos.toByteArray());
    }

    public String toBase64(Resource resource, String fileExtension) throws IOException, GendoxException {

        try (InputStream in = resource.getInputStream()) {
            byte[] imageBytes = in.readAllBytes();
            String base64 = Base64.getEncoder().encodeToString(imageBytes);
            String mimeType = getImageMimeType(fileExtension);
            return "data:" + mimeType + ";base64," + base64;
        }
    }

    public BufferedImage scaleToMaxSide(BufferedImage src, int maxSide) {
        int w = src.getWidth(), h = src.getHeight();
        int longest = Math.max(w, h);
        if (longest <= maxSide) return src;

        double s = (double) maxSide / longest;
        int nw = (int) Math.round(w * s);
        int nh = (int) Math.round(h * s);

        BufferedImage dst = new BufferedImage(nw, nh, src.getType());
        Graphics2D g = dst.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.drawImage(src, 0, 0, nw, nh, null);
        g.dispose();
        return dst;
    }

    public BufferedImage scaleToMinSide(BufferedImage src, int minSide) {
        int w = src.getWidth();
        int h = src.getHeight();
        int shortest = Math.min(w, h);

        // Already small enough (or exactly right)? Don’t upscale
        if (shortest <= minSide) {
            return src;
        }

        // Compute scale so shortest side == minSide
        double scale = (double) minSide / shortest;
        int newW = (int) Math.round(w * scale);
        int newH = (int) Math.round(h * scale);

        BufferedImage dst = new BufferedImage(newW, newH, src.getType());
        Graphics2D g = dst.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        g.setRenderingHint(RenderingHints.KEY_RENDERING,   RenderingHints.VALUE_RENDER_QUALITY);
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING,RenderingHints.VALUE_ANTIALIAS_ON);
        g.drawImage(src, 0, 0, newW, newH, null);
        g.dispose();

        return dst;
    }

    public float computeScaleForMinSide(PDPage page, int minSidePx) {
        float wPt = page.getMediaBox().getWidth();   // points (1 pt = 1/72")
        float hPt = page.getMediaBox().getHeight();
        float shortestPt = Math.min(wPt, hPt);
        return (float) minSidePx / shortestPt;
    }

    /**
     * Sets each pixel to {@code pixel * contrast + brightness}, then sharpens: {@code pixel * (1 + 4 * sharpen) - sharpen * (up + down + left + right)}.
     * {@code sharpen = 0} skips sharpening and {@code 1} is strong; stronger sharpening also amplifies scan noise and JPEG artifacts.
     */
    public BufferedImage enhanceForOCR(BufferedImage src, float contrast, float brightness, float sharpen) {
        // contrast > 1.0 increases contrast, brightness shifts (negative to darken)
        // Example: contrast = 1.15f, brightness = -10f
        RescaleOp rescale = new RescaleOp(contrast, brightness, null);
        BufferedImage contrasted = rescale.filter(src, null);
        if (sharpen <= 0f) {
            return contrasted;
        }

        // Simple sharpen kernel (unsharp-mask-ish); sharpen = 1 gives {0,-1,0,-1,5,-1,0,-1,0}
        float[] sharpKernel = {
                0,        -sharpen,          0,
                -sharpen, 1 + 4 * sharpen,   -sharpen,
                0,        -sharpen,          0
        };
        ConvolveOp sharpenOp = new ConvolveOp(new Kernel(3, 3, sharpKernel), ConvolveOp.EDGE_NO_OP, null);
        return sharpenOp.filter(contrasted, null);
    }


    /**
     * Returns an image embedded in a PDF as a data URI, without re-compressing it: a JPEG keeps its own bytes,
     * and a losslessly stored image is decoded and saved as PNG. Returns {@code null} when the image cannot be
     * sent as it is (JPEG 2000, CMYK, masks, mixed filters, or a decoder that is not installed).
     */
    public String toBase64Original(PDImageXObject image) throws IOException {
        if (image.getSoftMask() != null || image.getMask() != null || image.getDecode() != null) {
            return null;
        }
        List<COSName> filters = image.getStream().getFilters();

        // a JPEG, possibly wrapped in a lossless filter (e.g. [/FlateDecode /DCTDecode]), which is undone
        boolean jpeg = !filters.isEmpty() && filters.getLast().equals(COSName.DCT_DECODE)
                && LOSSLESS_FILTERS.containsAll(filters.subList(0, filters.size() - 1));
        if (jpeg) {
            PDColorSpace colorSpace = image.getColorSpace();
            boolean grayOrRgb = colorSpace instanceof PDDeviceRGB || colorSpace instanceof PDDeviceGray
                    || (colorSpace instanceof PDICCBased && colorSpace.getNumberOfComponents() != 4);
            if (!grayOrRgb) {
                return null;
            }
            try (InputStream in = image.getStream().createInputStream(List.of(COSName.DCT_DECODE.getName()))) {
                return "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(in.readAllBytes());
            }
        }

        if (!filters.isEmpty() && LOSSLESS_FILTERS.containsAll(filters)) {
            BufferedImage decoded;
            try {
                decoded = image.getImage();
            } catch (IOException e) {
                return null;    // e.g. no JBIG2 decoder on the classpath
            }
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(decoded, "png", baos);
            decoded.flush();
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(baos.toByteArray());
        }

        return null;
    }

    private String getImageMimeType(String extension) throws GendoxException {
        return switch (extension.toLowerCase()) {
            case ".jpg", ".jpeg" -> "image/jpeg";
            case ".png" -> "image/png";
            case ".gif" -> "image/gif";
            case ".bmp" -> "image/bmp";
            case ".tif", ".tiff" -> "image/tiff";
            case ".webp" -> "image/webp";
            case ".avif" -> "image/avif";
            case ".heic" -> "image/heic";
            case ".heif" -> "image/heif";
            case ".svg" -> "image/svg+xml";
            case ".ico" -> "image/x-icon";
            default -> throw new GendoxException(
                    "ERROR_UNSUPPORTED_IMAGE_FILE_TYPE",
                    "Unsupported image file type: " + extension,
                    HttpStatus.UNSUPPORTED_MEDIA_TYPE
            );
        };
    }



}
