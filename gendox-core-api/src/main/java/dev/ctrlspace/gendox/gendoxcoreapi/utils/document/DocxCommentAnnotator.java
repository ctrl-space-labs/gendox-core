package dev.ctrlspace.gendox.gendoxcoreapi.utils.document;

import org.docx4j.XmlUtils;
import org.docx4j.openpackaging.packages.WordprocessingMLPackage;
import org.docx4j.openpackaging.parts.WordprocessingML.CommentsPart;
import org.docx4j.wml.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.xml.datatype.DatatypeFactory;
import java.io.File;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.GregorianCalendar;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Standalone PoC utility: loads a .docx, finds target text for each {@link CommentEntry},
 * inserts a native Word comment, and saves the result to a new file.
 *
 * <p>Search strategy per entry:
 * <ol>
 *   <li>Try {@code commentOn}; if blank/null or not found, fall back to {@code article}.</li>
 *   <li>Among all matching paragraphs, annotate the <em>last</em> one (avoids table-of-contents).</li>
 * </ol>
 */
public class DocxCommentAnnotator {

    private static final Logger log = LoggerFactory.getLogger(DocxCommentAnnotator.class);
    private static final ObjectFactory WML = new ObjectFactory();
    private static final String W_NS = "xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\"";

    /** Input data for one comment. */
    public record CommentEntry(String article, String commentOn, String commentText) {}

    public void annotate(File input, List<CommentEntry> entries, File output) throws Exception {
        WordprocessingMLPackage pkg = WordprocessingMLPackage.load(input);

        // Bootstrap CommentsPart
        CommentsPart cp = pkg.getMainDocumentPart().getCommentsPart();
        if (cp == null) {
            cp = new CommentsPart();
            cp.setJaxbElement(WML.createComments());
            pkg.getMainDocumentPart().addTargetPart(cp);
        }
        Comments comments = cp.getContents();
        int commentId = comments.getComment().size();

        List<P> allParagraphs = new ArrayList<>();
        collectParagraphs(pkg.getMainDocumentPart().getContent(), allParagraphs);

        for (CommentEntry entry : entries) {
            if (isBlank(entry.commentText())) {
                log.warn("Skipping entry with blank commentText: article={}", entry.article());
                continue;
            }

            String primary  = isBlank(entry.commentOn()) ? null : entry.commentOn().trim();
            String fallback = isBlank(entry.article())   ? null : entry.article().trim();

            if (primary == null && fallback == null) {
                log.warn("Skipping entry with no search key: {}", entry.commentText());
                continue;
            }

            List<P> matches = primary != null ? find(allParagraphs, primary) : List.of();
            String  used    = primary;

            if (matches.isEmpty() && fallback != null) {
                if (primary != null) log.info("'{}' not found; falling back to article '{}'", primary, fallback);
                matches = find(allParagraphs, fallback);
                used    = fallback;
            }

            if (matches.isEmpty()) {
                log.warn("No match for article='{}', comment_on='{}' — skipped", entry.article(), entry.commentOn());
                continue;
            }

            try {
                insertComment(matches.get(matches.size() - 1), used, entry.commentText(), commentId++, comments);
            } catch (Exception e) {
                log.error("Failed to insert comment for article='{}', comment_on='{}'",
                        entry.article(), entry.commentOn(), e);
            }
        }

        pkg.save(output);
        log.info("Annotated document saved → {}", output.getAbsolutePath());
    }

    // Paragraph collection — recurses into tables

    private void collectParagraphs(List<Object> content, List<P> result) {
        for (Object item : content) {
            Object obj = XmlUtils.unwrap(item);
            if (obj instanceof P p) {
                result.add(p);
            } else if (obj instanceof Tbl tbl) {
                tbl.getContent().stream()
                        .map(XmlUtils::unwrap)
                        .filter(Tr.class::isInstance).map(Tr.class::cast)
                        .flatMap(tr -> tr.getContent().stream())
                        .map(XmlUtils::unwrap)
                        .filter(Tc.class::isInstance).map(Tc.class::cast)
                        .forEach(tc -> collectParagraphs(tc.getContent(), result));
            }
        }
    }

    // Text search

    private List<P> find(List<P> paragraphs, String searchText) {
        String needle = normalize(searchText);
        return paragraphs.stream()
                .filter(p -> normalize(rawText(p)).contains(needle))
                .collect(Collectors.toList());
    }

    private String rawText(P p) {
        return p.getContent().stream()
                .map(XmlUtils::unwrap)
                .filter(R.class::isInstance).map(R.class::cast)
                .flatMap(r -> r.getContent().stream())
                .map(XmlUtils::unwrap)
                .filter(Text.class::isInstance).map(Text.class::cast)
                .map(Text::getValue)
                .collect(Collectors.joining());
    }

    /**
     * Normalises for fuzzy matching: collapses whitespace, maps non-breaking space and
     * curly quotes to their plain-ASCII equivalents.
     */
    private String normalize(String text) {
        if (text == null) return "";
        return text.replace('\u00A0', ' ').replace('\u2019', '\'').replace('\u2018', '\'')
                   .replace('\u201C', '"').replace('\u201D', '"')
                   .replaceAll("\\s+", " ").trim();
    }

    private boolean isBlank(String s) { return s == null || s.isBlank(); }

    // Comment insertion

    /**
     * Inserts {@code w:commentRangeStart}, {@code w:commentRangeEnd}, and
     * {@code w:commentReference} around the runs that cover {@code searchText}.
     * Falls back to wrapping the entire paragraph when the phrase cannot be
     * located at run level (e.g. text split across exotic inline elements).
     *
     * <p>Note: anchoring is at whole-run granularity — no run splitting.
     */
    private void insertComment(P para, String searchText, String commentText,
                               int id, Comments comments) throws Exception {
        addCommentRecord(id, commentText, comments);

        List<Object> content = para.getContent();

        // Build run map: [contentIndex, charStart, charEnd]
        StringBuilder sb = new StringBuilder();
        List<int[]> runs = new ArrayList<>();
        for (int i = 0; i < content.size(); i++) {
            Object obj = XmlUtils.unwrap(content.get(i));
            if (obj instanceof R r) {
                int start = sb.length();
                r.getContent().stream().map(XmlUtils::unwrap)
                        .filter(Text.class::isInstance).map(Text.class::cast)
                        .forEach(t -> sb.append(t.getValue()));
                if (sb.length() > start) runs.add(new int[]{i, start, sb.length()});
            }
        }

        if (runs.isEmpty()) {
            content.addAll(List.of(rangeStart(id), rangeEnd(id), refRun(id)));
            return;
        }

        int first, last;
        int at = normalize(sb.toString()).indexOf(normalize(searchText));
        if (at >= 0) {
            int end = at + normalize(searchText).length();
            first = runs.stream().filter(r -> r[2] > at) .mapToInt(r -> r[0]).findFirst()          .orElse(runs.get(0)[0]);
            last  = runs.stream().filter(r -> r[1] < end).mapToInt(r -> r[0]).reduce((a, b) -> b)   .orElse(runs.get(runs.size() - 1)[0]);
        } else {
            log.debug("'{}' not found at run level; annotating whole paragraph", searchText);
            first = runs.get(0)[0];
            last  = runs.get(runs.size() - 1)[0];
        }

        // Insert from end → start to keep earlier indices stable
        content.add(last + 1, refRun(id));
        content.add(last + 1, rangeEnd(id));
        content.add(first, rangeStart(id));
    }

    // JAXB builders

    private void addCommentRecord(int id, String text, Comments comments) throws Exception {
        Comments.Comment c = WML.createCommentsComment();
        c.setId(BigInteger.valueOf(id));
        c.setAuthor("Gendox");
        c.setInitials("G");
        c.setDate(DatatypeFactory.newInstance().newXMLGregorianCalendar(new GregorianCalendar()));
        P body = WML.createP();
        R run  = WML.createR();
        Text t = WML.createText();
        t.setValue(text);
        run.getContent().add(t);
        body.getContent().add(run);
        c.getContent().add(body);
        comments.getComment().add(c);
    }

    private CommentRangeStart rangeStart(int id) {
        CommentRangeStart s = WML.createCommentRangeStart();
        s.setId(BigInteger.valueOf(id));
        return s;
    }

    private CommentRangeEnd rangeEnd(int id) {
        CommentRangeEnd e = WML.createCommentRangeEnd();
        e.setId(BigInteger.valueOf(id));
        return e;
    }

    private Object refRun(int id) throws Exception {
        // XmlUtils.unmarshalString avoids manually wrapping R$CommentReference in a JAXBElement
        return XmlUtils.unmarshalString(
                "<w:r " + W_NS + "><w:rPr><w:rStyle w:val=\"CommentReference\"/></w:rPr>" +
                "<w:commentReference w:id=\"" + id + "\"/></w:r>");
    }
}
