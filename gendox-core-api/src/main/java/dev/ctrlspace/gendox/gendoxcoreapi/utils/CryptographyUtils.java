package dev.ctrlspace.gendox.gendoxcoreapi.utils;

import org.apache.commons.codec.binary.Hex;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

@Component
public class CryptographyUtils {
    public String generateNonce() {
        SecureRandom secureRandom = new SecureRandom();
        byte[] nonceBytes = new byte[16]; // 128 bits = 16 bytes
        secureRandom.nextBytes(nonceBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(nonceBytes);
    }

    /**
     * Calculates the SHA-256 hash of the given content.
     *
     * @param content The content to hash
     * @return The SHA-256 hash as a hexadecimal string
     */
    public String calculateSHA256(String content) throws NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] encodedHash = digest.digest(content.getBytes(StandardCharsets.UTF_8));
        return Hex.encodeHexString(encodedHash);
    }

    /**
     * Calculates the SHA-256 hash of a file's bytes, read as a stream.
     *
     * @param file The file to hash
     * @return The SHA-256 hash as a hexadecimal string
     */
    public String calculateSHA256(Path file) throws IOException {
        try (InputStream in = Files.newInputStream(file)) {
            return DigestUtils.sha256Hex(in);
        }
    }
}
