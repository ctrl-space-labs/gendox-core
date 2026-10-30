package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.documents;

/**
 * The extracted text of one page.
 *
 * @param text              all the text on the page, including text that is not drawn
 * @param visibleCharacters non-whitespace characters that are actually drawn; a scan's invisible OCR layer
 *                          (render mode 3) has text but no visible characters
 */
public record PageText(String text, int visibleCharacters) {
}
