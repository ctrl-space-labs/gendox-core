package dev.ctrlspace.gendox.gendoxcoreapi.messages.postgres;


import dev.ctrlspace.gendox.gendoxcoreapi.messages.WorkerIdResolver;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QueueMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.QueueMessageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Duration;
import java.util.List;
import java.util.function.Consumer;

@Service
public class QueueConsumerService {

    private final QueueMessageRepository repo;
    private final TransactionTemplate tx;

    private final String workerId;
    private final boolean deadOnFailure; // maxAttempts=1 => true
    private final Duration visibilityTimeout;

    public QueueConsumerService(
            QueueMessageRepository repo,
            TransactionTemplate tx
    ) {
        this.repo = repo;
        this.tx = tx;

        this.workerId = WorkerIdResolver.resolve();
        this.deadOnFailure = true; // maxAttempts=1 for now
        this.visibilityTimeout = Duration.ofMinutes(60);
    }

    /**
     * Poll exactly one topic once:
     * - claim N messages
     * - process them as a batch
     * - ack or nack/dead as a batch
     *
     * Call this from one or more @Scheduled pollers.
     */
    public void pollTopicOnce(String topic, int batchSize, Consumer<List<QueueMessage>> handler) {
        // (optional) recovery of stuck messages; you can move this to a separate @Scheduled if you prefer
        releaseStuck(visibilityTimeout);

        // 1) Claim batch (transaction holds row locks during select, then marks IN_PROGRESS)
        List<QueueMessage> batch = claimBatch(topic, batchSize);
        if (batch.isEmpty()) return;

        List<Long> ids = batch.stream().map(QueueMessage::getId).toList();

        // 2) Process outside the claim transaction (keeps DB locks short)
        try {
            handler.accept(batch);

            // 3) Ack all (separate short transaction)
            tx.executeWithoutResult(s -> repo.ackBatch(ids, workerId));
        } catch (Exception ex) {
            String err = safeErr(ex);

            // maxAttempts=1 => DEAD on failure; otherwise NACK with delay
            if (deadOnFailure) {
                tx.executeWithoutResult(s -> repo.deadBatch(ids, workerId, err));
            } else {
                // immediate requeue; you can compute delay/backoff here
                tx.executeWithoutResult(s -> repo.nackBatch(ids, workerId, 0, err));
            }
        }
    }

    /** Release stuck IN_PROGRESS rows back to NEW (visibility timeout). */
    public int releaseStuck(Duration timeout) {
        Integer updated = tx.execute(status ->
                repo.releaseStuck((int) timeout.getSeconds())
        );
        return updated == null ? 0 : updated;
    }

    private List<QueueMessage> claimBatch(String topic, int batchSize) {
        return tx.execute(status -> {
            List<QueueMessage> batch = repo.findBatchForUpdate(topic, batchSize);
            if (batch.isEmpty()) return List.of();

            List<Long> ids = batch.stream().map(QueueMessage::getId).toList();
            repo.markInProgressBatch(ids, workerId);

            // We return the entities to be processed after commit.
            return batch;
        });
    }

    private static String safeErr(Throwable t) {
        String s = (t == null) ? "unknown" : t.toString();
        return s.length() > 4000 ? s.substring(0, 4000) : s;
    }
}

