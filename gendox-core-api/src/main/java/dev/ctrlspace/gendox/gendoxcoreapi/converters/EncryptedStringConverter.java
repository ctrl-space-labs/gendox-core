package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecretCipher;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.stereotype.Component;

/**
 * Put on an entity field that holds a secret:
 *
 * <pre>@Convert(converter = EncryptedStringConverter.class)</pre>
 *
 * The value is encrypted when the entity is written and decrypted when it is
 * read, so the code that uses the field sees the plain value. The column must be
 * text, and nothing can search it by value.
 */
@Component
@Converter
public class EncryptedStringConverter implements AttributeConverter<String, String> {

    private final SecretCipher cipher;

    public EncryptedStringConverter(SecretCipher cipher) {
        this.cipher = cipher;
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        return cipher.encrypt(attribute);
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        return cipher.decrypt(dbData);
    }
}
