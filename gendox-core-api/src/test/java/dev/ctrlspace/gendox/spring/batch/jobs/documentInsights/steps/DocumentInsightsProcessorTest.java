package dev.ctrlspace.gendox.spring.batch.jobs.documentInsights.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.CompletionQuestionRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskNodeValueDTO;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class DocumentInsightsProcessorTest {


    @InjectMocks
    private DocumentInsightsProcessor documentInsightsProcessor;     // class under test


    /* -----------------------------------------------------------------------
     * Helpers
     * -------------------------------------------------------------------- */
    private TaskNode mockTaskNode(UUID id, String text) {
        TaskNode node          = Mockito.mock(TaskNode.class);
        TaskNodeValueDTO nodeValue    = Mockito.mock(TaskNodeValueDTO.class);

        when(node.getId()).thenReturn(id);
        when(node.getNodeValue()).thenReturn(nodeValue);
        when(nodeValue.getMessage()).thenReturn(text);

        return node;
    }

    private List<TaskNode> makeTaskNodes(int count) {
        List<TaskNode> nodes = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            UUID id = UUID.randomUUID();
            nodes.add(mockTaskNode(id, "Question " + id));
        }
        return nodes;
    }

    /** 1) Empty input → empty output list */
    @Test
    void chunkQuestions_emptyList_returnsEmpty() {
        List<List<CompletionQuestionRequest>> buckets =
                documentInsightsProcessor.chunkQuestionsToGroups(List.of());

        assertTrue(buckets.isEmpty(), "Expected no buckets for empty input");
    }

    /** 2) Fewer than CHUNK_SIZE questions → single bucket */
    @Test
    void chunkQuestions_lessThanChunkSize_singleBucket() {
        int chunk = DocumentInsightsProcessor.CHUNK_SIZE;       // ← dynamic size
        List<TaskNode> input = makeTaskNodes(chunk - 1);         // e.g. 9 if chunk=10

        List<List<CompletionQuestionRequest>> buckets =
                documentInsightsProcessor.chunkQuestionsToGroups(input);

        assertEquals(1, buckets.size(), "Should produce exactly one bucket");
        assertEquals(chunk - 1, buckets.get(0).size(),
                "Bucket should contain all input questions");
    }

    /** 3) Exactly CHUNK_SIZE questions → single full bucket */
    @Test
    void chunkQuestions_exactChunkSize_singleFullBucket() {
        int chunk = DocumentInsightsProcessor.CHUNK_SIZE;
        List<TaskNode> input = makeTaskNodes(chunk);

        List<List<CompletionQuestionRequest>> buckets =
                documentInsightsProcessor.chunkQuestionsToGroups(input);

        assertEquals(1, buckets.size(), "Still one bucket");
        assertEquals(chunk, buckets.get(0).size(), "Bucket must be exactly full");
    }

    /** 4) count = 2·chunk + chunk/2 → three buckets */
    @Test
    void chunkQuestions_twoAndHalfChunks_threeBuckets() {
        int chunk = DocumentInsightsProcessor.CHUNK_SIZE;
        int total = (int)(2.5 * chunk);          // 2½ chunks (e.g. 25 when chunk = 10)
        List<TaskNode> input = makeTaskNodes(total);

        List<List<CompletionQuestionRequest>> buckets =
                documentInsightsProcessor.chunkQuestionsToGroups(input);

        int expectedBuckets      = (total + chunk - 1) / chunk;          // ceil div
        int expectedLastSize     = total % chunk == 0 ? chunk : total % chunk;

        assertEquals(expectedBuckets, buckets.size(),
                total + " items should create " + expectedBuckets + " buckets");

        assertEquals(expectedLastSize,
                buckets.get(buckets.size() - 1).size(),
                "Last bucket should contain remainder of questions");
    }

    /** 5) IDs & text copied correctly */
    @Test
    void chunkQuestions_preservesIdsAndText() {
        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();
        TaskNode n1 = mockTaskNode(id1, "Life, universe and everything");
        TaskNode n2 = mockTaskNode(id2, "What is your quest?");

        List<List<CompletionQuestionRequest>> buckets =
                documentInsightsProcessor.chunkQuestionsToGroups(List.of(n1, n2));

        CompletionQuestionRequest first  = buckets.get(0).get(0);
        CompletionQuestionRequest second = buckets.get(0).get(1);

        assertAll(
                () -> assertEquals(id1, first.getQuestionId()),
                () -> assertEquals("Life, universe and everything", first.getQuestionText()),
                () -> assertEquals(id2, second.getQuestionId()),
                () -> assertEquals("What is your quest?", second.getQuestionText())
        );
    }
}
