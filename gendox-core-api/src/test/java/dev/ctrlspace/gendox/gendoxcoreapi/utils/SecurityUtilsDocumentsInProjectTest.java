package dev.ctrlspace.gendox.gendoxcoreapi.utils;

import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ChatThreadDocumentsRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.DocumentInstanceRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.AdditionalMatchers.aryEq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SecurityUtilsDocumentsInProjectTest {

    @InjectMocks
    private SecurityUtils securityUtils;

    @Mock
    private DocumentInstanceRepository documentInstanceRepository;

    @Mock
    private ChatThreadDocumentsRepository chatThreadDocumentsRepository;

    private final UUID projectId = UUID.randomUUID();

    @Test
    void duplicateAndNullIds_areRemovedBeforeQuerying() {
        UUID doc = UUID.randomUUID();
        when(documentInstanceRepository.areAllDocumentIdsInAnyProject(
                aryEq(new UUID[]{doc}), aryEq(new UUID[]{projectId}))).thenReturn(true);

        assertTrue(securityUtils.areAllDocumentsInAnyProject(Arrays.asList(doc, null, doc), List.of(projectId)));
        verifyNoInteractions(chatThreadDocumentsRepository);
    }

    @Test
    void chatAttachmentOfProject_isAccepted() {
        UUID doc = UUID.randomUUID();
        when(documentInstanceRepository.areAllDocumentIdsInAnyProject(
                aryEq(new UUID[]{doc}), aryEq(new UUID[]{projectId}))).thenReturn(false);
        when(chatThreadDocumentsRepository.areAllDocumentIdsInAnyProject(
                aryEq(new UUID[]{doc}), aryEq(new UUID[]{projectId}))).thenReturn(true);

        assertTrue(securityUtils.areAllDocumentsInAnyProject(List.of(doc), List.of(projectId)));
    }

    @Test
    void documentOutsideProject_isRejected() {
        UUID doc = UUID.randomUUID();
        when(documentInstanceRepository.areAllDocumentIdsInAnyProject(
                aryEq(new UUID[]{doc}), aryEq(new UUID[]{projectId}))).thenReturn(false);
        when(chatThreadDocumentsRepository.areAllDocumentIdsInAnyProject(
                aryEq(new UUID[]{doc}), aryEq(new UUID[]{projectId}))).thenReturn(false);

        assertFalse(securityUtils.areAllDocumentsInAnyProject(List.of(doc), List.of(projectId)));
    }
}
