package dev.ctrlspace.gendox.spring.batch.jobs.documentInsights.steps;

import com.knuddels.jtokkit.Encodings;
import com.knuddels.jtokkit.api.EncodingRegistry;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.CompletionQuestionRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskNodeValueDTO;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mockito;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class DocumentInsightsProcessorQuestionsCountSplitTest {

    @Spy
    private EncodingRegistry encodingRegistry =
            Encodings.newDefaultEncodingRegistry();

    @InjectMocks
    private DocumentInsightsProcessor documentInsightsProcessor;

    private static Task task;


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

    @BeforeAll
    static void initTask() {
        task = new Task();
        task.setMaxQuestionsPerBucket(10);
        task.setMaxQuestionTokensPerBucket(5_000);
        task.setMaxSectionsChunkTokens(100_000);
    }

    /** 1) Empty input → empty output list */
    @Test
    void chunkQuestions_emptyList_returnsEmpty() throws GendoxException {
        List<List<CompletionQuestionRequest>> buckets =
                documentInsightsProcessor.chunkQuestionsToGroups(task, List.of());

        assertTrue(buckets.isEmpty(), "Expected no buckets for empty input");
    }

    /** 2) Fewer than CHUNK_SIZE questions → single bucket */
    @Test
    void chunkQuestions_lessThanChunkSize_singleBucket() throws GendoxException {
        int chunk = task.getMaxQuestionsPerBucket();
        List<TaskNode> input = makeTaskNodes(chunk - 1);         // e.g. 9 if chunk=10

        List<List<CompletionQuestionRequest>> buckets =
                documentInsightsProcessor.chunkQuestionsToGroups(task, input);

        assertEquals(1, buckets.size(), "Should produce exactly one bucket");
        assertEquals(chunk - 1, buckets.get(0).size(),
                "Bucket should contain all input questions");
    }

    /** 3) Exactly CHUNK_SIZE questions → single full bucket */
    @Test
    void chunkQuestions_exactChunkSize_singleFullBucket() throws GendoxException {
        int chunk = task.getMaxQuestionsPerBucket();
        List<TaskNode> input = makeTaskNodes(chunk);

        List<List<CompletionQuestionRequest>> buckets =
                documentInsightsProcessor.chunkQuestionsToGroups(task, input);

        assertEquals(1, buckets.size(), "Still one bucket");
        assertEquals(chunk, buckets.get(0).size(), "Bucket must be exactly full");
    }

    /** 4) count = 2·chunk + chunk/2 → three buckets */
    @Test
    void chunkQuestions_twoAndHalfChunks_threeBuckets() throws GendoxException {
        int chunk = task.getMaxQuestionsPerBucket();
        int total = (int)(2.5 * chunk);          // 2½ chunks (e.g. 25 when chunk = 10)
        List<TaskNode> input = makeTaskNodes(total);

        List<List<CompletionQuestionRequest>> buckets =
                documentInsightsProcessor.chunkQuestionsToGroups(task, input);

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
    void chunkQuestions_preservesIdsAndText() throws GendoxException {
        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();
        TaskNode n1 = mockTaskNode(id1, "Life, universe and everything");
        TaskNode n2 = mockTaskNode(id2, "What is your quest?");

        List<List<CompletionQuestionRequest>> buckets =
                documentInsightsProcessor.chunkQuestionsToGroups(task, List.of(n1, n2));

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
