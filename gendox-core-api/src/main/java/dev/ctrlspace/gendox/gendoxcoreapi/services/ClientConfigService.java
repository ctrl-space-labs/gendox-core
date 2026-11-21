package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ClientConfigDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.info.BuildProperties;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

/**
 * The public configuration clients read before sign-in. Only addresses and versions: nothing
 * here may be secret, since anyone can read it.
 */
@Service
public class ClientConfigService {

    public static final String API_VERSION = "v1";

    private final String apiUrl;
    private final String oidcAuthority;
    private final String desktopClientId;
    private final String webClientId;
    private final List<String> allowedServers;
    private final String minDesktopAppVersion;
    private final Optional<BuildProperties> buildProperties;

    public ClientConfigService(@Value("${gendox.client-config.api-url}") String apiUrl,
                               @Value("${gendox.client-config.oidc-authority}") String oidcAuthority,
                               @Value("${gendox.client-config.desktop-client-id}") String desktopClientId,
                               @Value("${gendox.client-config.web-client-id:}") String webClientId,
                               @Value("${gendox.client-config.allowed-servers:}") String allowedServers,
                               @Value("${gendox.client-config.min-desktop-app-version}") String minDesktopAppVersion,
                               Optional<BuildProperties> buildProperties) {
        this.apiUrl = apiUrl.endsWith("/") ? apiUrl : apiUrl + "/";
        this.oidcAuthority = oidcAuthority;
        this.desktopClientId = desktopClientId;
        this.webClientId = webClientId == null || webClientId.isBlank() ? null : webClientId.trim();
        // Comma-separated in configuration; blanks are left out, so an empty setting means no switching
        this.allowedServers = allowedServers == null ? List.of() : Arrays.stream(allowedServers.split(","))
                .map(String::trim)
                .filter(server -> !server.isEmpty())
                .toList();
        this.minDesktopAppVersion = minDesktopAppVersion;
        this.buildProperties = buildProperties;
    }

    public ClientConfigDTO getClientConfig() {
        return new ClientConfigDTO(
                apiUrl,
                oidcAuthority,
                desktopClientId,
                webClientId,
                allowedServers,
                buildProperties.map(BuildProperties::getVersion).orElse(null),
                API_VERSION,
                minDesktopAppVersion);
    }
}
