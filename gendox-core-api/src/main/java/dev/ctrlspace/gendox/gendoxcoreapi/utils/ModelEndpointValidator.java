package dev.ctrlspace.gendox.gendoxcoreapi.utils;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.UnknownHostException;

/**
 * Checks the endpoint of a provider an organization added, when it is saved and before each call.
 * Gendox calls it from the server, so it must not reach the server's own network: only https, and only
 * public addresses, unless the deployment allows private endpoints (a self-hosted installation with a
 * model server on its own network).
 */
@Component
public class ModelEndpointValidator {

    private final boolean allowPrivateEndpoints;

    public ModelEndpointValidator(@Value("${gendox.custom-models.allow-private-endpoints:false}") boolean allowPrivateEndpoints) {
        this.allowPrivateEndpoints = allowPrivateEndpoints;
    }

    /**
     * The base URL as it is stored: checked, without a trailing slash.
     */
    public String normalizeBaseUrl(String baseUrl) throws GendoxException {
        if (baseUrl == null || baseUrl.isBlank()) {
            throw invalid("The endpoint URL is required");
        }
        String trimmed = baseUrl.trim();
        while (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        validate(trimmed);
        return trimmed;
    }

    /**
     * Each check in turn; the first that fails says why.
     */
    public void validate(String url) throws GendoxException {
        URI uri = parse(url);
        requireAllowedScheme(uri);
        requireHost(uri);
        requireNoCredentialsQueryOrFragment(uri);
        if (allowPrivateEndpoints) {
            // a self-hosted installation may call a model server on its own network
            return;
        }
        requirePublicAddresses(uri.getHost());
    }

    private URI parse(String url) throws GendoxException {
        if (url == null) {
            throw invalid("The endpoint URL is required");
        }
        try {
            return new URI(url);
        } catch (URISyntaxException e) {
            throw invalid("The endpoint URL is not valid");
        }
    }

    // https always; http only where private endpoints are allowed
    private void requireAllowedScheme(URI uri) throws GendoxException {
        String scheme = uri.getScheme();
        if ("https".equalsIgnoreCase(scheme)) {
            return;
        }
        if (!allowPrivateEndpoints) {
            throw invalid("The endpoint URL must start with https://");
        }
        if ("http".equalsIgnoreCase(scheme)) {
            return;
        }
        throw invalid("The endpoint URL must start with https:// or http://");
    }

    private void requireHost(URI uri) throws GendoxException {
        String host = uri.getHost();
        if (host == null) {
            throw invalid("The endpoint URL has no host");
        }
        if (host.isBlank()) {
            throw invalid("The endpoint URL has no host");
        }
    }

    // the key goes in a header; a URL with more than an address could carry other secrets or change the path
    private void requireNoCredentialsQueryOrFragment(URI uri) throws GendoxException {
        if (uri.getRawUserInfo() != null) {
            throw invalid("The endpoint URL cannot have a user name or password");
        }
        if (uri.getRawQuery() != null) {
            throw invalid("The endpoint URL cannot have a query");
        }
        if (uri.getRawFragment() != null) {
            throw invalid("The endpoint URL cannot have a fragment");
        }
    }

    // every address the host resolves to, so a name cannot point at the server's own network
    private void requirePublicAddresses(String host) throws GendoxException {
        InetAddress[] addresses;
        try {
            addresses = InetAddress.getAllByName(host);
        } catch (UnknownHostException e) {
            throw invalid("The endpoint host cannot be resolved");
        }
        for (InetAddress address : addresses) {
            if (!isPublic(address)) {
                throw invalid("The endpoint must be a public address");
            }
        }
    }

    static boolean isPublic(InetAddress address) {
        if (address.isAnyLocalAddress()) {
            return false; // 0.0.0.0, ::
        }
        if (address.isLoopbackAddress()) {
            return false; // 127.0.0.0/8, ::1
        }
        if (address.isLinkLocalAddress()) {
            return false; // 169.254.0.0/16, where cloud metadata services are; fe80::/10
        }
        if (address.isSiteLocalAddress()) {
            return false; // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
        }
        if (address.isMulticastAddress()) {
            return false;
        }
        // Java returns an IPv4-mapped IPv6 address (::ffff:a.b.c.d) as an IPv4 address
        if (address instanceof Inet6Address) {
            return !isUniqueLocalIpv6(address.getAddress());
        }
        return !isReservedIpv4(address.getAddress());
    }

    // fc00::/7
    private static boolean isUniqueLocalIpv6(byte[] bytes) {
        int first = bytes[0] & 0xff;
        return first == 0xfc || first == 0xfd;
    }

    // the IPv4 ranges Java's checks above leave out
    private static boolean isReservedIpv4(byte[] bytes) {
        int first = bytes[0] & 0xff;
        int second = bytes[1] & 0xff;
        int third = bytes[2] & 0xff;
        if (first == 0) {
            return true; // 0.0.0.0/8, "this network"
        }
        if (first >= 240) {
            return true; // 240.0.0.0/4 and the broadcast address
        }
        if (first == 100 && second >= 64 && second <= 127) {
            return true; // 100.64.0.0/10, carrier-grade NAT
        }
        if (first == 192 && second == 0 && third == 0) {
            return true; // 192.0.0.0/24
        }
        if (first == 198 && second >= 18 && second <= 19) {
            return true; // 198.18.0.0/15, benchmarking
        }
        return false;
    }

    private GendoxException invalid(String message) {
        return new GendoxException("INVALID_MODEL_ENDPOINT", message, HttpStatus.BAD_REQUEST);
    }
}
