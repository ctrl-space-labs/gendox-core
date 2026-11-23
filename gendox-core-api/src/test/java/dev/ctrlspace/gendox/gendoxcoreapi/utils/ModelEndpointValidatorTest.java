package dev.ctrlspace.gendox.gendoxcoreapi.utils;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.net.InetAddress;

import static org.junit.jupiter.api.Assertions.*;

class ModelEndpointValidatorTest {

    private final ModelEndpointValidator validator = new ModelEndpointValidator(false);
    private final ModelEndpointValidator selfHosted = new ModelEndpointValidator(true);

    @Test
    void aPublicHttpsAddressIsKeptWithoutItsTrailingSlash() throws GendoxException {
        assertEquals("https://8.8.8.8/v1", validator.normalizeBaseUrl(" https://8.8.8.8/v1/ "));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "http://8.8.8.8/v1",                 // not https
            "ftp://8.8.8.8/v1",
            "https://localhost/v1",
            "https://127.0.0.1/v1",
            "https://10.0.0.5/v1",
            "https://172.16.0.1/v1",
            "https://192.168.1.10/v1",
            "https://169.254.169.254/latest",    // cloud metadata
            "https://100.64.0.1/v1",
            "https://0.0.0.0/v1",
            "https://[::1]/v1",
            "https://[fd00::1]/v1",
            "https://[::ffff:127.0.0.1]/v1",
            "https://user:secret@8.8.8.8/v1",    // credentials in the URL
            "https://8.8.8.8/v1?key=x",
            "not a url",
            ""
    })
    void anAddressInsideTheNetworkOrAMalformedOneIsRefused(String url) {
        GendoxException e = assertThrows(GendoxException.class, () -> validator.normalizeBaseUrl(url));
        assertEquals("INVALID_MODEL_ENDPOINT", e.getErrorCode());
    }

    @Test
    void aSelfHostedInstallationMayAllowPrivateAddressesAndHttp() throws GendoxException {
        assertEquals("http://192.168.1.10:11434/v1", selfHosted.normalizeBaseUrl("http://192.168.1.10:11434/v1"));
        assertThrows(GendoxException.class, () -> selfHosted.normalizeBaseUrl("file:///etc/passwd"));
    }

    @Test
    void publicAddresses() throws Exception {
        assertTrue(ModelEndpointValidator.isPublic(InetAddress.getByName("8.8.8.8")));
        assertTrue(ModelEndpointValidator.isPublic(InetAddress.getByName("2001:4860:4860::8888")));
        assertFalse(ModelEndpointValidator.isPublic(InetAddress.getByName("198.18.0.1")));
        assertFalse(ModelEndpointValidator.isPublic(InetAddress.getByName("255.255.255.255")));
    }
}
