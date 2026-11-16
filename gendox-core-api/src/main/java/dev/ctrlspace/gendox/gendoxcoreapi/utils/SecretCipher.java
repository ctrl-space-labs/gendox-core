package dev.ctrlspace.gendox.gendoxcoreapi.utils;

import com.amazonaws.services.kms.AWSKMSClientBuilder;
import com.amazonaws.services.kms.model.DecryptRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.function.UnaryOperator;

/**
 * Turns a stored secret into its encrypted form and back.
 *
 * <p>The keys come from {@code gendox.secrets.keys} (environment variable
 * {@code GENDOX_SECRETS_KEYS}): a comma-separated list of
 * {@code <provider>:<reference>}. The first key encrypts new values; every key
 * in the list still decrypts what it encrypted before. A key is 32 bytes:
 * <ul>
 *   <li>{@code env:<the key in base64>}</li>
 *   <li>{@code file:<path of a file that holds the key in base64>}</li>
 *   <li>{@code aws-kms:<the key encrypted by AWS KMS, in base64>}, decrypted by KMS once at startup</li>
 * </ul>
 *
 * <p>A stored value is {@code enc:v1:<key id>:<base64 of nonce + ciphertext + tag>},
 * AES-256-GCM with a random nonce. The key id is a fingerprint of the key, so the
 * value itself says which key reads it. A value without the prefix is read as it is.
 */
@Component
public class SecretCipher {

    public static final String PREFIX = "enc:v1:";

    private static final int NONCE_BYTES = 12;
    private static final int TAG_BITS = 128;

    private final Map<String, SecretKey> keys = new LinkedHashMap<>();
    private final String currentKeyId;
    private final SecureRandom random = new SecureRandom();

    @Autowired
    public SecretCipher(@Value("${gendox.secrets.keys:}") String configuredKeys) {
        this(configuredKeys, encryptedKey -> {
            ByteBuffer plain = AWSKMSClientBuilder.defaultClient()
                    .decrypt(new DecryptRequest().withCiphertextBlob(ByteBuffer.wrap(encryptedKey)))
                    .getPlaintext();
            byte[] key = new byte[plain.remaining()];
            plain.get(key);
            return key;
        });
    }

    SecretCipher(String configuredKeys, UnaryOperator<byte[]> kmsDecrypt) {
        int position = 0;
        for (String entry : configuredKeys.split(",")) {
            if (entry.isBlank()) {
                continue;
            }
            position++;
            try {
                byte[] key = loadKey(entry.trim(), kmsDecrypt);
                keys.putIfAbsent(keyId(key), new SecretKeySpec(key, "AES"));
            } catch (Exception e) {
                // neither the entry nor the cause is quoted: for some providers the entry is the key
                throw new IllegalStateException("gendox.secrets.keys, key " + position + " could not be loaded ("
                        + e.getClass().getSimpleName() + "). Expected env:, file: or aws-kms: and 32 bytes in base64.");
            }
        }
        this.currentKeyId = keys.keySet().stream().findFirst().orElse(null);
    }

    private static byte[] loadKey(String entry, UnaryOperator<byte[]> kmsDecrypt) throws Exception {
        String[] parts = entry.split(":", 2);
        String reference = parts.length == 2 ? parts[1].trim() : "";
        byte[] key = switch (parts[0]) {
            case "env" -> Base64.getDecoder().decode(reference);
            case "file" -> Base64.getDecoder().decode(Files.readString(Path.of(reference)).trim());
            case "aws-kms" -> kmsDecrypt.apply(Base64.getDecoder().decode(reference));
            default -> throw new IllegalArgumentException("unknown provider");
        };
        if (key.length != 32) {
            throw new IllegalArgumentException("not 32 bytes");
        }
        return key;
    }

    private static String keyId(byte[] key) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        digest.update("gendox-secrets-key:".getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(digest.digest(key), 0, 8);
    }

    /** The id of the key that encrypts new values, or null when no key is configured. */
    public String currentKeyId() {
        return currentKeyId;
    }

    public Set<String> keyIds() {
        return keys.keySet();
    }

    /** The id of the key that encrypted a stored value, or null for a value stored as it is. */
    public static String keyIdOf(String stored) {
        if (stored == null || !stored.startsWith(PREFIX)) {
            return null;
        }
        int end = stored.indexOf(':', PREFIX.length());
        return end < 0 ? "" : stored.substring(PREFIX.length(), end);
    }

    public String encrypt(String plain) {
        if (plain == null) {
            return null;
        }
        if (plain.startsWith(PREFIX)) {
            // it would be read back as a stored value
            throw new IllegalArgumentException("A secret cannot start with " + PREFIX);
        }
        if (currentKeyId == null) {
            return plain;
        }
        try {
            byte[] nonce = new byte[NONCE_BYTES];
            random.nextBytes(nonce);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, keys.get(currentKeyId), new GCMParameterSpec(TAG_BITS, nonce));
            byte[] encrypted = cipher.doFinal(plain.getBytes(StandardCharsets.UTF_8));
            byte[] payload = ByteBuffer.allocate(nonce.length + encrypted.length).put(nonce).put(encrypted).array();
            return PREFIX + currentKeyId + ":" + Base64.getEncoder().encodeToString(payload);
        } catch (Exception e) {
            throw new IllegalStateException("A secret could not be encrypted", e);
        }
    }

    public String decrypt(String stored) {
        String keyId = keyIdOf(stored);
        if (keyId == null) {
            return stored;
        }
        SecretKey key = keys.get(keyId);
        if (key == null) {
            throw new IllegalStateException("A stored secret uses key " + keyId
                    + ", which gendox.secrets.keys does not list");
        }
        try {
            byte[] payload = Base64.getDecoder().decode(stored.substring(PREFIX.length() + keyId.length() + 1));
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, payload, 0, NONCE_BYTES));
            return new String(cipher.doFinal(payload, NONCE_BYTES, payload.length - NONCE_BYTES), StandardCharsets.UTF_8);
        } catch (Exception e) {
            // changed, truncated, or not encrypted by this key
            throw new IllegalStateException("A stored secret on key " + keyId + " could not be decrypted", e);
        }
    }
}
