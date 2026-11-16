package dev.ctrlspace.gendox.gendoxcoreapi.utils;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SecretCipherTest {

    private static final String KEY_A = "env:" + base64Key(1);
    private static final String KEY_B = "env:" + base64Key(2);

    private static String base64Key(int fill) {
        byte[] key = new byte[32];
        Arrays.fill(key, (byte) fill);
        return Base64.getEncoder().encodeToString(key);
    }

    @Test
    void aValueComesBackAsItWas() {
        SecretCipher cipher = new SecretCipher(KEY_A);

        String stored = cipher.encrypt("sk-secret-ünïcode");

        assertThat(stored).startsWith("enc:v1:" + cipher.currentKeyId() + ":").doesNotContain("sk-secret");
        assertThat(cipher.decrypt(stored)).isEqualTo("sk-secret-ünïcode");
        assertThat(SecretCipher.keyIdOf(stored)).isEqualTo(cipher.currentKeyId());
    }

    @Test
    void theSameValueIsStoredDifferentlyEachTime() {
        SecretCipher cipher = new SecretCipher(KEY_A);

        assertThat(cipher.encrypt("same")).isNotEqualTo(cipher.encrypt("same"));
    }

    @Test
    void aChangedOrTruncatedValueIsRejected() {
        SecretCipher cipher = new SecretCipher(KEY_A);
        String stored = cipher.encrypt("value");
        char last = stored.charAt(stored.length() - 2);
        String changed = stored.substring(0, stored.length() - 2) + (last == 'A' ? 'B' : 'A') + stored.charAt(stored.length() - 1);

        assertThatThrownBy(() -> cipher.decrypt(changed)).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> cipher.decrypt(stored.substring(0, stored.length() - 8)))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void aValueWithoutThePrefixIsReadAsItIs() {
        SecretCipher cipher = new SecretCipher(KEY_A);

        assertThat(cipher.decrypt("stored before encryption")).isEqualTo("stored before encryption");
        assertThat(SecretCipher.keyIdOf("stored before encryption")).isNull();
        assertThat(cipher.decrypt(null)).isNull();
        assertThat(cipher.encrypt(null)).isNull();
    }

    @Test
    void withNoKeyAValueIsStoredAsItIs() {
        SecretCipher cipher = new SecretCipher(" ");

        assertThat(cipher.currentKeyId()).isNull();
        assertThat(cipher.keyIds()).isEmpty();
        assertThat(cipher.encrypt("value")).isEqualTo("value");
        assertThat(cipher.decrypt("value")).isEqualTo("value");
    }

    @Test
    void theFirstKeyEncryptsAndAnOlderKeyStillReadsItsValues() {
        String storedWithA = new SecretCipher(KEY_A).encrypt("value");
        SecretCipher afterTheChange = new SecretCipher(KEY_B + " , " + KEY_A);

        assertThat(afterTheChange.keyIds()).hasSize(2);
        assertThat(afterTheChange.decrypt(storedWithA)).isEqualTo("value");
        assertThat(SecretCipher.keyIdOf(afterTheChange.encrypt("value")))
                .isEqualTo(afterTheChange.currentKeyId())
                .isNotEqualTo(SecretCipher.keyIdOf(storedWithA));
    }

    @Test
    void aValueOfAKeyThatIsNotListedNamesTheKey() {
        SecretCipher cipherA = new SecretCipher(KEY_A);
        String storedWithA = cipherA.encrypt("value");

        assertThatThrownBy(() -> new SecretCipher(KEY_B).decrypt(storedWithA))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining(cipherA.currentKeyId());
    }

    @Test
    void aSecretThatLooksLikeAStoredValueIsRefused() {
        assertThatThrownBy(() -> new SecretCipher(KEY_A).encrypt("enc:v1:abc:def"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new SecretCipher("").encrypt("enc:v1:abc:def"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void aKeyHasTheSameIdWhateverProviderLoadedIt(@TempDir Path directory) throws Exception {
        Path file = Files.writeString(directory.resolve("key"), base64Key(7) + "\n");
        byte[] encryptedByKms = {9, 8, 7};

        String fromEnv = new SecretCipher("env:" + base64Key(7)).currentKeyId();
        String fromFile = new SecretCipher("file:" + file).currentKeyId();
        String fromKms = new SecretCipher("aws-kms:" + Base64.getEncoder().encodeToString(encryptedByKms),
                encryptedKey -> {
                    assertThat(encryptedKey).isEqualTo(encryptedByKms);
                    return Base64.getDecoder().decode(base64Key(7));
                }).currentKeyId();

        assertThat(fromEnv).hasSize(16).isEqualTo(fromFile).isEqualTo(fromKms);
    }

    @Test
    void anEntryThatCannotBeLoadedSaysWhichOneAndNeverQuotesIt() {
        String shortKey = Base64.getEncoder().encodeToString(new byte[16]);

        assertThatThrownBy(() -> new SecretCipher(KEY_A + ",env:" + shortKey))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("key 2")
                .hasMessageNotContaining(shortKey);
        assertThatThrownBy(() -> new SecretCipher("env:not base64 !"))
                .hasMessageNotContaining("not base64");
        assertThatThrownBy(() -> new SecretCipher("vault:something"))
                .hasMessageNotContaining("something");
        assertThatThrownBy(() -> new SecretCipher(base64Key(1)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageNotContaining(base64Key(1));
    }
}
