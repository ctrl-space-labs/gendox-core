package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecretCipher;
import org.junit.jupiter.api.Test;

import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;

class EncryptedJsonConverterTest {

    private static final String JSON = "{\"apiKey\": \"fc-secret\"}";

    private final SecretCipher cipher = new SecretCipher("env:" + Base64.getEncoder().encodeToString(new byte[32]));
    private final EncryptedJsonConverter converter = new EncryptedJsonConverter(cipher);

    @Test
    void theEncryptedValueIsStoredAsAJsonString() {
        String stored = converter.convertToDatabaseColumn(JSON);

        assertThat(stored).startsWith("\"enc:v1:" + cipher.currentKeyId() + ":").endsWith("\"").doesNotContain("fc-secret");
        // nothing inside the quotes that JSON would escape
        assertThat(stored.substring(1, stored.length() - 1)).doesNotContain("\"").doesNotContain("\\");
        assertThat(converter.convertToEntityAttribute(stored)).isEqualTo(JSON);
    }

    @Test
    void jsonStoredAsItIsIsReadAsItIs() {
        assertThat(converter.convertToEntityAttribute(JSON)).isEqualTo(JSON);
        assertThat(converter.convertToEntityAttribute("\"a JSON string\"")).isEqualTo("\"a JSON string\"");
        assertThat(converter.convertToEntityAttribute(null)).isNull();
        assertThat(converter.convertToDatabaseColumn(null)).isNull();
    }
}
