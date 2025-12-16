package dev.ctrlspace.gendox.spring.batch.jobs.documentInsights.steps;

import com.knuddels.jtokkit.Encodings;
import com.knuddels.jtokkit.api.Encoding;
import com.knuddels.jtokkit.api.EncodingRegistry;
import com.knuddels.jtokkit.api.ModelType;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.CompletionQuestionRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskNodeValueDTO;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mockito;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

/**
 * Additional edge‑case tests for token‑aware bucketing.
 */
@ExtendWith(MockitoExtension.class)
class DocumentInsightsProcessorQuestionSplitEdgeCasesTest {

    private static int QUESTION_LIMIT;
    private static int TOKEN_LIMIT;

    @Spy
    private EncodingRegistry encodingRegistry = Encodings.newDefaultEncodingRegistry();

    @InjectMocks
    private DocumentInsightsProcessor processor;

    private Encoding enc;
    private static Task task;

    @BeforeEach
    void setUp() {
        enc = encodingRegistry.getEncodingForModel(ModelType.GPT_4O);
    }

    @BeforeAll
    static void initTask() {
        task = new Task();
        task.setMaxQuestionsPerBucket(10);
        QUESTION_LIMIT = 10;
        task.setMaxQuestionTokensPerBucket(5_000);
        TOKEN_LIMIT = 5_000;
        task.setMaxSectionsChunkTokens(100_000);
    }

    /* ───────────── helpers ─────────────────────────────────────────────── */

    private String textWithAtLeastTokens(int minTokens) {
        StringBuilder sb = new StringBuilder("this is a 10 token sentence !! !! !!");
        while (enc.countTokens(sb.toString()) < minTokens) {
            sb.append(" this is a 10 token sentence !! !! !!");
        }
        return sb.toString();
    }

    private TaskNode nodeWithTokens(int minTokens) {
        UUID id = UUID.randomUUID();
        TaskNode n = Mockito.mock(TaskNode.class);
        TaskNodeValueDTO v = Mockito.mock(TaskNodeValueDTO.class);
        when(n.getId()).thenReturn(id);
        when(n.getNodeValue()).thenReturn(v);
        when(v.getMessage()).thenReturn(textWithAtLeastTokens(minTokens));
        return n;
    }

    private TaskNode nodeWithRawText(String txt) {
        UUID id = UUID.randomUUID();
        TaskNode n = Mockito.mock(TaskNode.class);
        TaskNodeValueDTO v = Mockito.mock(TaskNodeValueDTO.class);
        when(n.getId()).thenReturn(id);
        when(n.getNodeValue()).thenReturn(v);
        when(v.getMessage()).thenReturn(txt);
        return n;
    }

    private int sumTokens(List<CompletionQuestionRequest> bucket) {
        return bucket.stream().mapToInt(r -> enc.countTokens(r.getQuestionText())).sum();
    }


    /** 1 ) Everything fits comfortably → 1 bucket, tokens <= 10 000 */
    @Test
    void allSmallQuestions_singleBucket() throws GendoxException {
        int smallTokens = 800;                // 800 × 5  = 4 000  << 10 000
        List<TaskNode> input = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            input.add(nodeWithTokens(smallTokens));
        }

        List<List<CompletionQuestionRequest>> buckets =
                processor.chunkQuestionsToGroups(task, input);

        assertEquals(1, buckets.size(), "All questions should fit together");
        assertEquals(5, buckets.get(0).size());
        assertTrue( sumTokens(buckets.get(0)) <= TOKEN_LIMIT,
                "Token budget must not be exceeded");
    }

    @Test
    void tokenOverflow_startsNewBucket() throws GendoxException {
        // pick a size so that two fit but three do not
        int safeSize = task.getMaxQuestionTokensPerBucket() / 2 - 50;
        assertTrue(2 * safeSize < task.getMaxQuestionTokensPerBucket(),
                "sanity: two safes must fit");
        assertTrue(3 * safeSize > task.getMaxQuestionTokensPerBucket(),
                "sanity: three safes must overflow");

        TaskNode q1 = nodeWithTokens(safeSize);
        TaskNode q2 = nodeWithTokens(safeSize);   // bucket 1 ≈ 2*safeSize < limit
        TaskNode q3 = nodeWithTokens(safeSize);   // would push >limit → new bucket

        List<List<CompletionQuestionRequest>> buckets =
                processor.chunkQuestionsToGroups(task, List.of(q1, q2, q3));

        assertEquals(2, buckets.size(), "Expect two buckets due to token overflow");
        // first bucket got q1+q2
        assertEquals(2, buckets.get(0).size());
        // second bucket got q3
        assertEquals(1, buckets.get(1).size());

        assertTrue(sumTokens(buckets.get(0)) <= task.getMaxQuestionTokensPerBucket());
        assertTrue(sumTokens(buckets.get(1)) <= task.getMaxQuestionTokensPerBucket());
    }

    /** 3 ) Question >10 000 tokens → must live alone in its own bucket */
    @Test
    void oversizedQuestion_getsOwnBucket() throws GendoxException {
        TaskNode huge   = nodeWithTokens(TOKEN_LIMIT + 2_000); // > limit
        TaskNode small1 = nodeWithTokens(500);
        TaskNode small2 = nodeWithTokens(500);

        List<List<CompletionQuestionRequest>> buckets =
                processor.chunkQuestionsToGroups(task, List.of(huge, small1, small2));

        assertEquals(2, buckets.size(), "Oversize + combined smalls");

        // bucket[0] = [huge]
        assertEquals(1, buckets.get(0).size());
        assertTrue( sumTokens(buckets.get(0)) > TOKEN_LIMIT,
                "Single oversized question may exceed token limit");

        // bucket[1] contains the two small questions
        assertEquals(2, buckets.get(1).size());
        assertTrue( sumTokens(buckets.get(1)) <= TOKEN_LIMIT);
    }

    /** 4 ) Late tiny question should back‑fill earlier bucket if there’s room */
    @Test
    void lateSmallQuestion_backfillsEarlierBucket() throws GendoxException {
        int almostFull = (TOKEN_LIMIT - 1_000) / (QUESTION_LIMIT - 1); // plenty of headroom
        List<TaskNode> list = new ArrayList<>();

        // 9 large-ish questions → bucket uses < TOKEN_LIMIT and has <10 items
        for (int i = 0; i < QUESTION_LIMIT - 1; i++) {
            list.add(nodeWithTokens(almostFull));
        }
        // tiny question comes last
        TaskNode tiny = nodeWithTokens(100);
        list.add(tiny);

        List<List<CompletionQuestionRequest>> buckets =
                processor.chunkQuestionsToGroups(task, list);

        assertEquals(1, buckets.size(),
                "Tiny question should fit into the first bucket (back‑fill)");
        List<CompletionQuestionRequest> bucket = buckets.get(0);
        assertEquals(QUESTION_LIMIT, bucket.size(), "Bucket should now be full (10 items)");
        assertTrue( sumTokens(bucket) <= TOKEN_LIMIT,
                "Token total must stay within limit");
    }

    /** 5) Bucket packed close to the token ceiling but still ≤ limit */
    @Test
    void nearTokenCeiling_singleBucket() throws GendoxException {
        int each = TOKEN_LIMIT / QUESTION_LIMIT - 50;                 // e.g. 950 tokens
        List<TaskNode> input = IntStream.range(0, QUESTION_LIMIT)
                .mapToObj(i -> nodeWithTokens(each))
                .toList();

        List<List<CompletionQuestionRequest>> result = processor.chunkQuestionsToGroups(task, input);

        assertEquals(1, result.size());
        assertEquals(QUESTION_LIMIT, result.get(0).size());
        assertTrue(sumTokens(result.get(0)) <= TOKEN_LIMIT);
    }

    /** 6) Exactly full bucket (questions=10, tokens≈10 000) then one extra tiny question */
    @Test
    void fullBucket_thenExtraQuestion_startsNewBucket() throws GendoxException {
        int each = TOKEN_LIMIT / QUESTION_LIMIT;                      // ≈1000 tokens
        List<TaskNode> full = IntStream.range(0, QUESTION_LIMIT)
                .mapToObj(i -> nodeWithTokens(each))
                .toList();
        List<TaskNode> input = new ArrayList<>(full);
        input.add(nodeWithTokens(10));                     // tiny

        List<List<CompletionQuestionRequest>> res = processor.chunkQuestionsToGroups(task, input);

        assertEquals(2, res.size(), "Extra tiny question should open a 2nd bucket");
        assertEquals(QUESTION_LIMIT, res.get(0).size());
        assertEquals(1, res.get(1).size());
    }

    /** 7) Question‑count limit reached even though plenty of token head‑room */
    @Test
    void questionLimitTriggersSplit() throws GendoxException {
        List<TaskNode> input = IntStream.range(0, QUESTION_LIMIT + 1) // 11 questions
                .mapToObj(i -> nodeWithTokens(50))  // 50 tokens each
                .toList();

        List<List<CompletionQuestionRequest>> res = processor.chunkQuestionsToGroups(task, input);

        assertEquals(2, res.size());
        assertEquals(QUESTION_LIMIT, res.get(0).size());
        assertEquals(1, res.get(1).size());
    }

    /** 8) Token overflow triggers split even with only two questions */
    @Test
    void tokenOverflow_twoQuestions() throws GendoxException {
        // pick each just over half the limit so together they overflow
        int halfPlus = task.getMaxQuestionTokensPerBucket() / 2 + 1;
        assertTrue(halfPlus * 2 > task.getMaxQuestionTokensPerBucket(),
                "sanity: two halfPluses must overflow");

        TaskNode q1 = nodeWithTokens(halfPlus);
        TaskNode q2 = nodeWithTokens(halfPlus);

        List<List<CompletionQuestionRequest>> buckets =
                processor.chunkQuestionsToGroups(task, List.of(q1, q2));

        assertEquals(2, buckets.size(), "Should split into two when sum > limit");
        assertTrue(sumTokens(buckets.get(0)) <= task.getMaxQuestionTokensPerBucket());
        assertTrue(sumTokens(buckets.get(1)) <= task.getMaxQuestionTokensPerBucket());
    }

    /** 9) Multiple oversized questions – each must stand alone */
    @Test
    void multipleOversizedQuestions_eachOwnBucket() throws GendoxException {
        TaskNode big1 = nodeWithTokens(TOKEN_LIMIT + 1_000);
        TaskNode big2 = nodeWithTokens(TOKEN_LIMIT + 2_000);
        TaskNode big3 = nodeWithTokens(TOKEN_LIMIT + 3_000);

        List<List<CompletionQuestionRequest>> res =
                processor.chunkQuestionsToGroups(task, List.of(big1, big2, big3));

        assertEquals(3, res.size());
        res.forEach(b -> assertEquals(1, b.size(), "Oversized must be solitary"));
    }

    /** 10) Zero‑token questions (empty strings) – split only by question count */
    @Test
    void zeroTokenQuestions_groupedByCount() throws GendoxException {
        List<TaskNode> input = IntStream.range(0, QUESTION_LIMIT + 2) // 12 empties
                .mapToObj(i -> nodeWithRawText(""))
                .toList();

        List<List<CompletionQuestionRequest>> res = processor.chunkQuestionsToGroups(task, input);

        assertEquals(2, res.size());
        assertEquals(QUESTION_LIMIT, res.get(0).size());
        assertEquals(2, res.get(1).size());
        res.forEach(b -> assertEquals(0, sumTokens(b)));   // token sum should be 0
    }

    /** 11) 30 small questions + 2 huge ones, random order →
     *      3 compact small‑buckets (10/10/10) + 2 singleton huge‑buckets. */
    @Test
    void mixedSmallAndHugeQuestions_expectedPacking() throws GendoxException {
        int smallTokens = 200;                              // well under the 10 000 limit
        int hugeTokens  = TOKEN_LIMIT + 4_000;                  // definitely oversized

        List<TaskNode> questions = new ArrayList<>();

        // add 30 small
        for (int i = 0; i < 30; i++) {
            questions.add(nodeWithTokens(smallTokens));
        }
        // add 2 huge
        questions.add(nodeWithTokens(hugeTokens));
        questions.add(nodeWithTokens(hugeTokens));

        // random order
        Collections.shuffle(questions, new Random(42));// seed for reproducibility

        /*  run SUT  */
        List<List<CompletionQuestionRequest>> buckets = processor.chunkQuestionsToGroups(task, questions);

        /*  classify buckets  */
        int smallBucketCount = 0;
        int hugeBucketCount  = 0;
        int smallQuestionTotal = 0;

        for (List<CompletionQuestionRequest> b : buckets) {
            int size  = b.size();
            int tokens = sumTokens(b);

            if (size == 1 && tokens > TOKEN_LIMIT) {
                hugeBucketCount++;
            } else {
                smallBucketCount++;
                smallQuestionTotal += size;

                assertTrue(tokens <= TOKEN_LIMIT, "Small bucket token budget exceeded");
                assertTrue(size    <= QUESTION_LIMIT, "Small bucket question‑count exceeded");
            }
        }

        /*  expectations  */
        assertEquals(5,                buckets.size(),         "Total buckets");
        assertEquals(3,                smallBucketCount,       "Three small‑question buckets");
        assertEquals(30,               smallQuestionTotal,     "All 30 small questions placed");
        assertEquals(2,                hugeBucketCount,        "Two singleton huge buckets");
    }
}
