package dev.ctrlspace.gendox.spring.batch.jobs.secretsReencrypt.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.repositories.SecretColumnRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.SecretColumnRepository.SecretColumn;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.SecretColumnRepository.StoredSecret;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecretCipher;
import dev.ctrlspace.gendox.spring.batch.jobs.secretsReencrypt.SecretsReencryptJobConfig;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.infrastructure.item.ItemReader;
import org.springframework.stereotype.Component;

import java.util.ArrayDeque;
import java.util.Iterator;
import java.util.List;
import java.util.Queue;
import java.util.UUID;

/**
 * Reads the stored values that the current key did not encrypt: one secret
 * column after the other, each in pages by id.
 */
@Component
@StepScope
public class SecretsReencryptReader implements ItemReader<SecretsReencryptReader.StoredValue> {

    /** A stored value, and the column it is in */
    public record StoredValue(SecretColumn column, UUID id, String secret) {
    }

    private static final UUID BEFORE_ALL_IDS = new UUID(0L, 0L);

    private final SecretCipher cipher;
    private final SecretColumnRepository secretColumnRepository;
    private final Iterator<SecretColumn> columns;

    private SecretColumn column;
    private UUID afterId;
    private boolean lastPage = true;
    private final Queue<StoredSecret> page = new ArrayDeque<>();

    public SecretsReencryptReader(SecretCipher cipher, SecretColumnRepository secretColumnRepository) {
        this.cipher = cipher;
        this.secretColumnRepository = secretColumnRepository;
        this.columns = secretColumnRepository.columns().iterator();
    }

    @Override
    public StoredValue read() {
        if (cipher.currentKeyId() == null) {
            return null;
        }
        String onCurrentKey = SecretCipher.PREFIX + cipher.currentKeyId() + ":%";

        while (page.isEmpty()) {
            if (lastPage) {
                if (!columns.hasNext()) {
                    return null;
                }
                column = columns.next();
                afterId = BEFORE_ALL_IDS;
            }
            List<StoredSecret> rows =
                    secretColumnRepository.findNotOnKey(column, onCurrentKey, afterId, SecretsReencryptJobConfig.CHUNK_SIZE);
            lastPage = rows.size() < SecretsReencryptJobConfig.CHUNK_SIZE;
            if (!rows.isEmpty()) {
                afterId = rows.getLast().id();
                page.addAll(rows);
            }
        }

        StoredSecret next = page.poll();
        return new StoredValue(column, next.id(), next.secret());
    }
}
