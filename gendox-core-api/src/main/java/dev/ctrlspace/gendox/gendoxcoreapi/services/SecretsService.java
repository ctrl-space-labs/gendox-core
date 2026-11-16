package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.repositories.SecretColumnRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecretCipher;
import dev.ctrlspace.gendox.spring.batch.utils.JobExecutionParamConstants;
import org.springframework.batch.core.job.Job;
import org.springframework.batch.core.job.JobExecution;
import org.springframework.batch.core.job.parameters.JobParameters;
import org.springframework.batch.core.job.parameters.JobParametersBuilder;
import org.springframework.batch.core.launch.JobOperator;
import org.springframework.beans.factory.SmartInitializingSingleton;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * The stored secrets as a whole: how many each key holds, and moving them to
 * the current key after the key list changed.
 */
@Service
public class SecretsService implements SmartInitializingSingleton {

    /** The entry of {@link Status#valuesPerKey()} for values stored as they are. */
    public static final String NO_KEY = "none";

    /** @param valuesPerKey for each configured key, and each key that stored values name, how many values it holds */
    public record Status(String currentKey, Map<String, Long> valuesPerKey) {
    }

    private final SecretColumnRepository secretColumnRepository;
    private final SecretCipher cipher;
    private final JobOperator jobOperator;
    private final Job secretsReencryptJob;

    public SecretsService(SecretColumnRepository secretColumnRepository,
                          SecretCipher cipher,
                          JobOperator jobOperator,
                          Job secretsReencryptJob) {
        this.secretColumnRepository = secretColumnRepository;
        this.cipher = cipher;
        this.jobOperator = jobOperator;
        this.secretsReencryptJob = secretsReencryptJob;
    }

    public Status getStatus() {
        Map<String, Long> valuesPerKey = new TreeMap<>();
        cipher.keyIds().forEach(keyId -> valuesPerKey.put(keyId, 0L));
        secretColumnRepository.countPerKey().forEach((keyId, count) ->
                valuesPerKey.merge(keyId == null ? NO_KEY : keyId, count, Long::sum));
        return new Status(cipher.currentKeyId(), valuesPerKey);
    }

    /**
     * Starts the job that moves every stored value to the current key. The job
     * runs in the background; {@link #getStatus()} shows what is left.
     */
    public JobExecution reencrypt() throws Exception {
        JobParameters params = new JobParametersBuilder()
                .addString(JobExecutionParamConstants.JOB_NAME, secretsReencryptJob.getName())
                .addString(JobExecutionParamConstants.NOW, Instant.now().toString())
                .toJobParameters();
        return jobOperator.start(secretsReencryptJob, params);
    }

    /**
     * A key cannot be taken out of the list while values still need it: the
     * application does not start, and says which key is missing.
     */
    @Override
    public void afterSingletonsInstantiated() {
        List<String> missing = getStatus().valuesPerKey().keySet().stream()
                .filter(keyId -> !keyId.equals(NO_KEY) && !cipher.keyIds().contains(keyId))
                .toList();
        if (!missing.isEmpty()) {
            throw new IllegalStateException("Stored secrets are encrypted with keys " + missing
                    + ", which gendox.secrets.keys does not list. Put them back in the list and start again.");
        }
    }
}
