package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.QueueMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface QueueMessageRepository extends JpaRepository<QueueMessage, Long> {

    // 1) Lock + read a batch of NEW messages for a topic
    // MUST be called inside a transaction, so the row locks are held during the SELECT.
    @Query(value = """
      select *
      from gendox_core.queue_messages
      where topic = :topic
        and status = 'NEW'
        and available_at <= now()
      order by id
      for update skip locked
      limit :batchSize
      """, nativeQuery = true)
    List<QueueMessage> findBatchForUpdate(@Param("topic") String topic,
                                          @Param("batchSize") int batchSize);

    // 2) Mark batch as IN_PROGRESS (claim)
    @Modifying
    @Query(value = """
      update gendox_core.queue_messages
      set status = 'IN_PROGRESS',
          locked_at = now(),
          locked_by = :workerId,
          updated_at = now()
      where id in (:ids)
        and status = 'NEW'
      """, nativeQuery = true)
    int markInProgressBatch(@Param("ids") List<Long> ids,
                            @Param("workerId") String workerId);

    // 3) ACK batch (DONE)
    @Modifying
    @Query(value = """
      update gendox_core.queue_messages
      set status = 'DONE',
          locked_at = null,
          locked_by = null,
          updated_at = now()
      where id in (:ids)
        and status = 'IN_PROGRESS'
        and locked_by = :workerId
      """, nativeQuery = true)
    int ackBatch(@Param("ids") List<Long> ids,
                 @Param("workerId") String workerId);

    // 4) NACK batch -> return to NEW (optionally with delay), increment attempts, set error
    @Modifying
    @Query(value = """
      update gendox_core.queue_messages
      set status = 'NEW',
          attempts = attempts + 1,
          available_at = now() + (:delaySeconds || ' seconds')::interval,
          last_error = :err,
          locked_at = null,
          locked_by = null,
          updated_at = now()
      where id in (:ids)
        and status = 'IN_PROGRESS'
        and locked_by = :workerId
      """, nativeQuery = true)
    int nackBatch(@Param("ids") List<Long> ids,
                  @Param("workerId") String workerId,
                  @Param("delaySeconds") int delaySeconds,
                  @Param("err") String err);

    // 5) DEAD batch (DLQ)
    @Modifying
    @Query(value = """
      update gendox_core.queue_messages
      set status = 'DEAD',
          attempts = attempts + 1,
          last_error = :err,
          locked_at = null,
          locked_by = null,
          updated_at = now()
      where id in (:ids)
        and status = 'IN_PROGRESS'
        and locked_by = :workerId
      """, nativeQuery = true)
    int deadBatch(@Param("ids") List<Long> ids,
                  @Param("workerId") String workerId,
                  @Param("err") String err);

    // 6) Release stuck IN_PROGRESS messages back to NEW (visibility timeout)
    @Modifying
    @Query(value = """
      update gendox_core.queue_messages
      set status = 'NEW',
          locked_at = null,
          locked_by = null,
          available_at = now(),
          updated_at = now()
      where status = 'IN_PROGRESS'
        and locked_at is not null
        and locked_at < now() - (:timeoutSeconds || ' seconds')::interval
      """, nativeQuery = true)
    int releaseStuck(@Param("timeoutSeconds") int timeoutSeconds);
}
