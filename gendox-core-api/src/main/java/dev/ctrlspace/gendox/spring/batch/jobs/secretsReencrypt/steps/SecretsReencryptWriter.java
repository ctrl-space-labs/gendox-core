package dev.ctrlspace.gendox.spring.batch.jobs.secretsReencrypt.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.repositories.SecretColumnRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecretCipher;
import org.springframework.batch.infrastructure.item.Chunk;
import org.springframework.batch.infrastructure.item.ItemWriter;
import org.springframework.stereotype.Component;

/**
 * Writes each value again, encrypted with the current key. A value that
 * somebody changed since it was read is left as it is: the next run takes it.
 * Only the secret column is written, so {@code updated_at} stays as it was.
 */
@Component
public class SecretsReencryptWriter implements ItemWriter<SecretsReencryptReader.StoredValue> {

    private final SecretCipher cipher;
    private final SecretColumnRepository secretColumnRepository;

    public SecretsReencryptWriter(SecretCipher cipher, SecretColumnRepository secretColumnRepository) {
        this.cipher = cipher;
        this.secretColumnRepository = secretColumnRepository;
    }

    @Override
    public void write(Chunk<? extends SecretsReencryptReader.StoredValue> chunk) {
        for (SecretsReencryptReader.StoredValue value : chunk) {
            String withCurrentKey = cipher.encrypt(cipher.decrypt(value.secret()));
            secretColumnRepository.update(value.column(), value.id(), value.secret(), withCurrentKey);
        }
    }
}
