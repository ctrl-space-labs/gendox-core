package dev.ctrlspace.gendox.gendoxcoreapi.utils;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ChatThreadDocumentsRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.DocumentInstanceRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.MessageLocalContextService;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SecurityUtilsDocumentsInProjectTest {

    @InjectMocks
    private SecurityUtils securityUtils;

    @Mock
    private DocumentInstanceRepository documentInstanceRepository;

    @Mock
    private ChatThreadDocumentsRepository chatThreadDocumentsRepository;

    @Mock
    private MessageLocalContextService messageLocalContextService;

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

    @Test
    void aChatUploadOfAnotherUserIsUsedOnlyInAThreadItIsAttachedTo() throws GendoxException {
        UUID doc = UUID.randomUUID();
        UUID threadId = UUID.randomUUID();
        when(documentInstanceRepository.areAllDocumentIdsInProjectsOrChats(any(), any())).thenReturn(true);
        when(documentInstanceRepository.existsByDocumentIdAndProjectIds(doc, List.of(projectId))).thenReturn(false);

        when(messageLocalContextService.isDocumentAttachedToThread(threadId, doc)).thenReturn(true);
        securityUtils.requireDocumentsInProject(List.of(doc), projectId, threadId);

        when(messageLocalContextService.isDocumentAttachedToThread(threadId, doc)).thenReturn(false);
        assertThrows(GendoxException.class, () -> securityUtils.requireDocumentsInProject(List.of(doc), projectId, threadId));
    }

    @Test
    void aDocumentOfTheKnowledgeBaseIsUsedInAnyThread() throws GendoxException {
        UUID doc = UUID.randomUUID();
        when(documentInstanceRepository.areAllDocumentIdsInProjectsOrChats(any(), any())).thenReturn(true);
        when(documentInstanceRepository.existsByDocumentIdAndProjectIds(doc, List.of(projectId))).thenReturn(true);

        securityUtils.requireDocumentsInProject(List.of(doc), projectId, UUID.randomUUID());
    }
}
