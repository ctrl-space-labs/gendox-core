package dev.ctrlspace.gendox.gendoxcoreapi.utils;

import org.apache.pdfbox.contentstream.PDFGraphicsStreamEngine;
import org.apache.pdfbox.cos.COSName;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.image.PDImage;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.pdmodel.graphics.state.RenderingMode;
import org.apache.pdfbox.pdmodel.interactive.annotation.PDAnnotation;
import org.apache.pdfbox.pdmodel.interactive.annotation.PDAnnotationLink;
import org.apache.pdfbox.util.Matrix;

import java.awt.geom.Area;
import java.awt.geom.GeneralPath;
import java.awt.geom.Point2D;
import java.awt.geom.Rectangle2D;
import java.io.IOException;

/**
 * Finds the scanned image of a page, when the page is nothing more than that image.
 * <p>
 * A page qualifies when one image, drawn upright, covers at least {@link #MIN_COVERAGE} of the crop box,
 * and nothing visible is painted on top of it: text must be invisible (an OCR layer, render mode 3),
 * and paths or other images must be fully clipped out. Paint before the image is ignored, as the image
 * hides it. Annotations other than links disqualify the page, since they are drawn too.
 */
public final class ScannedPageImageFinder extends PDFGraphicsStreamEngine {

    private static final double MIN_COVERAGE = 0.9;

    private final GeneralPath path = new GeneralPath();
    private int pendingClipRule = -1;

    private PDImageXObject scan;
    private boolean visiblePaintOverScan;

    private ScannedPageImageFinder(PDPage page) {
        super(page);
    }

    /** Returns the page's scanned image, or {@code null} if the page is more than one upright image. */
    public static PDImageXObject find(PDPage page) throws IOException {
        if (page.getRotation() % 360 != 0) {
            return null;
        }
        for (PDAnnotation annotation : page.getAnnotations()) {
            if (!(annotation instanceof PDAnnotationLink)) {
                return null;
            }
        }

        ScannedPageImageFinder finder = new ScannedPageImageFinder(page);
        finder.processPage(page);
        return finder.visiblePaintOverScan ? null : finder.scan;
    }

    @Override
    public void drawImage(PDImage pdImage) throws IOException {
        Matrix ctm = getGraphicsState().getCurrentTransformationMatrix();
        Rectangle2D bounds = ctm.createAffineTransform().createTransformedShape(new Rectangle2D.Float(0, 0, 1, 1)).getBounds2D();

        boolean upright = ctm.getShearX() == 0 && ctm.getShearY() == 0 && ctm.getScaleX() > 0 && ctm.getScaleY() > 0;
        if (scan == null && upright && pdImage instanceof PDImageXObject image
                && !image.isStencil() && coversPage(bounds)) {
            scan = image;
            return;
        }
        paint(bounds);
    }

    @Override
    protected void showText(byte[] string) throws IOException {
        RenderingMode mode = getGraphicsState().getTextState().getRenderingMode();
        if (mode == RenderingMode.NEITHER) {
            return;     // invisible text, e.g. an OCR layer
        }
        if (mode.isClip()) {
            visiblePaintOverScan = true;    // text clipping would cut into the image
            return;
        }
        // Glyph bounds are not worked out: any unclipped visible text counts as paint
        paint(getGraphicsState().getCurrentClippingPath().getBounds2D());
    }

    @Override
    public void appendRectangle(Point2D p0, Point2D p1, Point2D p2, Point2D p3) {
        path.moveTo(p0.getX(), p0.getY());
        path.lineTo(p1.getX(), p1.getY());
        path.lineTo(p2.getX(), p2.getY());
        path.lineTo(p3.getX(), p3.getY());
        path.closePath();
    }

    @Override
    public void clip(int windingRule) {
        pendingClipRule = windingRule;
    }

    @Override
    public void moveTo(float x, float y) {
        path.moveTo(x, y);
    }

    @Override
    public void lineTo(float x, float y) {
        path.lineTo(x, y);
    }

    @Override
    public void curveTo(float x1, float y1, float x2, float y2, float x3, float y3) {
        path.curveTo(x1, y1, x2, y2, x3, y3);
    }

    @Override
    public Point2D getCurrentPoint() {
        return path.getCurrentPoint();
    }

    @Override
    public void closePath() {
        path.closePath();
    }

    @Override
    public void endPath() {
        if (pendingClipRule != -1) {
            path.setWindingRule(pendingClipRule);
            getGraphicsState().intersectClippingPath(path);
            pendingClipRule = -1;
        }
        path.reset();
    }

    @Override
    public void strokePath() {
        paintPath();
    }

    @Override
    public void fillPath(int windingRule) {
        paintPath();
    }

    @Override
    public void fillAndStrokePath(int windingRule) {
        paintPath();
    }

    @Override
    public void shadingFill(COSName shadingName) {
        paint(getGraphicsState().getCurrentClippingPath().getBounds2D());
    }

    private void paintPath() {
        // grow by a point so that straight lines, which have no area, still count
        Rectangle2D bounds = path.getBounds2D();
        paint(new Rectangle2D.Double(bounds.getX() - 1, bounds.getY() - 1, bounds.getWidth() + 2, bounds.getHeight() + 2));
        endPath();
    }

    private void paint(Rectangle2D bounds) {
        Area clip = getGraphicsState().getCurrentClippingPath();
        if (scan != null && !clip.isEmpty() && clip.intersects(bounds)) {
            visiblePaintOverScan = true;
        }
    }

    private boolean coversPage(Rectangle2D imageBounds) {
        PDRectangle cropBox = getPage().getCropBox();
        Rectangle2D page = new Rectangle2D.Float(cropBox.getLowerLeftX(), cropBox.getLowerLeftY(), cropBox.getWidth(), cropBox.getHeight());
        Rectangle2D visible = imageBounds.createIntersection(page)
                .createIntersection(getGraphicsState().getCurrentClippingPath().getBounds2D());
        if (visible.isEmpty()) {
            return false;
        }
        return visible.getWidth() * visible.getHeight() >= MIN_COVERAGE * page.getWidth() * page.getHeight();
    }
}
