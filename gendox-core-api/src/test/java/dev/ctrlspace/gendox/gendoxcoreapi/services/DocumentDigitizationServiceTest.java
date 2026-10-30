package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.documents.PageText;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DocumentDigitizationServiceTest {

    @Test
    void shouldUsePrintedPage_nullTask_defaultsToTrue() {
        assertTrue(DocumentDigitizationService.shouldUsePrintedPage(null));
        assertFalse(DocumentDigitizationService.shouldUsePageText(null));
    }

    @Test
    void shouldUsePrintedPage_bothFlagsNull_defaultsToImagesOnly() {
        Task task = new Task();
        assertTrue(DocumentDigitizationService.shouldUsePrintedPage(task));
        assertFalse(DocumentDigitizationService.shouldUsePageText(task));
    }

    @Test
    void shouldUsePrintedPage_imageOnlyMode() {
        Task task = new Task();
        task.setUsePrintedPage(true);
        task.setUsePageText(false);
        assertTrue(DocumentDigitizationService.shouldUsePrintedPage(task));
        assertFalse(DocumentDigitizationService.shouldUsePageText(task));
    }

    @Test
    void shouldUsePrintedPage_textOnlyMode() {
        Task task = new Task();
        task.setUsePrintedPage(false);
        task.setUsePageText(true);
        assertFalse(DocumentDigitizationService.shouldUsePrintedPage(task));
        assertTrue(DocumentDigitizationService.shouldUsePageText(task));
    }

    @Test
    void shouldUsePrintedPage_bothEnabled() {
        Task task = new Task();
        task.setUsePrintedPage(true);
        task.setUsePageText(true);
        assertTrue(DocumentDigitizationService.shouldUsePrintedPage(task));
        assertTrue(DocumentDigitizationService.shouldUsePageText(task));
    }

    @Test
    void hasTextLayer_needsEnoughVisibleText() {
        String text = "a".repeat(DocumentDigitizationService.MIN_TEXT_LAYER_CHARACTERS);

        assertTrue(DocumentDigitizationService.hasTextLayer(new PageText(text, text.length())));
        assertFalse(DocumentDigitizationService.hasTextLayer(new PageText("Invoice 42", 9)));
    }

    @Test
    void hasTextLayer_invisibleOcrLayerIsNotOne() {
        String text = "a".repeat(1000);

        assertFalse(DocumentDigitizationService.hasTextLayer(new PageText(text, 0)));
    }

    @Test
    void hasTextLayer_unmappedGlyphsAreNotReadable() {
        String text = "a".repeat(300) + "\uFFFD".repeat(100);

        assertFalse(DocumentDigitizationService.hasTextLayer(new PageText(text, 400)));
    }

    @Test
    void thinksMoreThanDigitizationNeeds_onlyLowersTheEffort() {
        assertTrue(DocumentDigitizationService.thinksMoreThanDigitizationNeeds(model(true, "medium")));
        assertTrue(DocumentDigitizationService.thinksMoreThanDigitizationNeeds(model(true, "high")));
        assertFalse(DocumentDigitizationService.thinksMoreThanDigitizationNeeds(model(true, "low")));
        assertFalse(DocumentDigitizationService.thinksMoreThanDigitizationNeeds(model(true, "none")));
        assertFalse(DocumentDigitizationService.thinksMoreThanDigitizationNeeds(model(false, "medium")));
    }

    private static AiModel model(boolean supportsReasoning, String defaultEffort) {
        AiModel model = new AiModel();
        model.setSupportsReasoning(supportsReasoning);
        model.setDefaultReasoningEffort(defaultEffort);
        return model;
    }
}
