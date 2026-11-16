package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecretCipher;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.stereotype.Component;

/**
 * {@link EncryptedStringConverter} for a field that holds JSON text in a jsonb
 * column. The JSON is encrypted as a whole, and the encrypted value is stored
 * as a JSON string, so the column stays valid jsonb.
 */
@Component
@Converter
public class EncryptedJsonConverter implements AttributeConverter<String, String> {

    private final SecretCipher cipher;

    public EncryptedJsonConverter(SecretCipher cipher) {
        this.cipher = cipher;
    }

    @Override
    public String convertToDatabaseColumn(String json) {
        String stored = cipher.encrypt(json);
        // the encrypted value has no character that JSON escapes
        return SecretCipher.keyIdOf(stored) == null ? stored : "\"" + stored + "\"";
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData != null && dbData.startsWith("\"" + SecretCipher.PREFIX)) {
            return cipher.decrypt(dbData.substring(1, dbData.length() - 1));
        }
        return dbData;
    }
}
