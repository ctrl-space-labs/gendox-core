package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
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
}
