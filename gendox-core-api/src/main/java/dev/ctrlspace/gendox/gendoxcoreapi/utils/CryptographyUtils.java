package dev.ctrlspace.gendox.gendoxcoreapi.utils;

import org.apache.commons.codec.binary.Hex;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
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
}
