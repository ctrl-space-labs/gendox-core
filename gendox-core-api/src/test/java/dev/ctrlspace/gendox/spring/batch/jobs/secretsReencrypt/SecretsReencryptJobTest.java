package dev.ctrlspace.gendox.spring.batch.jobs.secretsReencrypt;

import dev.ctrlspace.gendox.gendoxcoreapi.repositories.SecretColumnRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.SecretColumnRepository.SecretColumn;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.SecretColumnRepository.StoredSecret;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecretCipher;
import dev.ctrlspace.gendox.spring.batch.jobs.secretsReencrypt.steps.SecretsReencryptReader;
import dev.ctrlspace.gendox.spring.batch.jobs.secretsReencrypt.steps.SecretsReencryptReader.StoredValue;
import dev.ctrlspace.gendox.spring.batch.jobs.secretsReencrypt.steps.SecretsReencryptWriter;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.batch.infrastructure.item.Chunk;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.when;

class SecretsReencryptJobTest {

    private static final String OLD_KEY = "env:" + base64Key(1);
    private static final String NEW_KEY = "env:" + base64Key(2);

    private static String base64Key(int fill) {
        byte[] key = new byte[32];
        Arrays.fill(key, (byte) fill);
        return Base64.getEncoder().encodeToString(key);
    }

    private static List<StoredSecret> rows(int from, int to) {
        List<StoredSecret> rows = new ArrayList<>();
        for (int i = from; i < to; i++) {
            rows.add(new StoredSecret(new UUID(0L, i), "secret-" + i));
        }
        return rows;
    }

    private static final SecretColumn FIRST = new SecretColumn("\"s\".\"first\"", "\"id\"", "\"secret\"", false);
    private static final SecretColumn SECOND = new SecretColumn("\"s\".\"second\"", "\"id\"", "\"config\"", true);

    @Test
    void theReaderGoesThroughEveryPageOfEveryColumn() {
        int page = SecretsReencryptJobConfig.CHUNK_SIZE;
        SecretCipher cipher = new SecretCipher(NEW_KEY);
        String onCurrentKey = "enc:v1:" + cipher.currentKeyId() + ":%";
        SecretColumnRepository repository = mock(SecretColumnRepository.class);
        when(repository.columns()).thenReturn(List.of(FIRST, SECOND));
        // the first column has a full page and three more values, the second has one
        when(repository.findNotOnKey(FIRST, onCurrentKey, new UUID(0L, 0L), page)).thenReturn(rows(1, page + 1));
        when(repository.findNotOnKey(FIRST, onCurrentKey, new UUID(0L, page), page)).thenReturn(rows(page + 1, page + 4));
        when(repository.findNotOnKey(SECOND, onCurrentKey, new UUID(0L, 0L), page)).thenReturn(rows(1, 2));
        SecretsReencryptReader reader = new SecretsReencryptReader(cipher, repository);

        List<StoredValue> read = new ArrayList<>();
        for (StoredValue value = reader.read(); value != null; value = reader.read()) {
            read.add(value);
        }

        assertThat(read).hasSize(page + 3 + 1);
        assertThat(read.subList(0, page + 3)).allMatch(value -> value.column() == FIRST);
        assertThat(read.getLast().column()).isSameAs(SECOND);
        assertThat(read.getFirst().secret()).isEqualTo("secret-1");
        assertThat(reader.read()).isNull();
    }

    @Test
    void withNoKeyThereIsNothingToMove() {
        SecretColumnRepository repository = mock(SecretColumnRepository.class);
        when(repository.columns()).thenReturn(List.of(FIRST));
        SecretsReencryptReader reader = new SecretsReencryptReader(new SecretCipher(""), repository);

        assertThat(reader.read()).isNull();
        verify(repository, never()).findNotOnKey(any(), anyString(), any(), anyInt());
    }

    @Test
    void theWriterReplacesTheValueItReadWithOneOfTheCurrentKey() {
        SecretCipher oldCipher = new SecretCipher(OLD_KEY);
        SecretCipher cipher = new SecretCipher(NEW_KEY + "," + OLD_KEY);
        SecretColumnRepository repository = mock(SecretColumnRepository.class);
        UUID encryptedId = UUID.randomUUID();
        UUID plainId = UUID.randomUUID();
        String withOldKey = oldCipher.encrypt("sk-one");

        new SecretsReencryptWriter(cipher, repository).write(Chunk.of(
                new StoredValue(FIRST, encryptedId, withOldKey),
                new StoredValue(SECOND, plainId, "sk-stored-as-it-is")));

        ArgumentCaptor<String> written = ArgumentCaptor.forClass(String.class);
        verify(repository).update(eq(FIRST), eq(encryptedId), eq(withOldKey), written.capture());
        assertThat(SecretCipher.keyIdOf(written.getValue())).isEqualTo(cipher.currentKeyId());
        assertThat(cipher.decrypt(written.getValue())).isEqualTo("sk-one");

        verify(repository).update(eq(SECOND), eq(plainId), eq("sk-stored-as-it-is"), written.capture());
        assertThat(cipher.decrypt(written.getValue())).isEqualTo("sk-stored-as-it-is");
        verify(repository, never()).findNotOnKey(any(), anyString(), any(), anyInt());
    }
}
