package dev.ctrlspace.gendox.gendoxcoreapi.utils;

import org.springframework.stereotype.Component;

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
}
