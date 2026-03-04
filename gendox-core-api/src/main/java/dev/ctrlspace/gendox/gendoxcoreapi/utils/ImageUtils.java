package dev.ctrlspace.gendox.gendoxcoreapi.utils;


import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DownloadService;
import org.apache.pdfbox.pdmodel.PDPage;
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

@Component
public class ImageUtils {


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

    public BufferedImage enhanceForOCR(BufferedImage src, float contrast, float brightness) {
        // contrast > 1.0 increases contrast, brightness shifts (negative to darken)
        // Example: contrast = 1.15f, brightness = -10f
        RescaleOp rescale = new RescaleOp(contrast, brightness, null);
        BufferedImage contrasted = rescale.filter(src, null);

        // Simple sharpen kernel (unsharp-mask-ish)
        float[] sharpKernel = {
                0,  -1,  0,
                -1,   5, -1,
                0,  -1,  0
        };
        ConvolveOp sharpen = new ConvolveOp(new Kernel(3, 3, sharpKernel), ConvolveOp.EDGE_NO_OP, null);
        return sharpen.filter(contrasted, null);
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
