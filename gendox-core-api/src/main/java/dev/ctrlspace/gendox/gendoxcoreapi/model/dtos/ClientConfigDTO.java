package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import java.util.List;

/**
 * What a client, such as the desktop app, needs to know to use this server.
 *
 * @param apiUrl               base URL of the API, ending in a slash
 * @param oidcAuthority        the OpenID Connect issuer users sign in with
 * @param desktopClientId      the public OIDC client of the desktop app
 * @param webClientId          the public OIDC client of the web app, or null when the web app keeps its own setting
 * @param allowedServers       the other servers the web app served beside this API may switch to, as origins
 *                             such as {@code https://dev-app-2.gendox.dev} or {@code https://*.gendox.dev};
 *                             empty, the web app offers no switching
 * @param serverVersion        version of this server, or null when the build carries none
 * @param apiVersion           version of the API, as in its path
 * @param minDesktopAppVersion lowest desktop app version this server accepts
 */
public record ClientConfigDTO(
        String apiUrl,
        String oidcAuthority,
        String desktopClientId,
        String webClientId,
        List<String> allowedServers,
        String serverVersion,
        String apiVersion,
        String minDesktopAppVersion) {
}
