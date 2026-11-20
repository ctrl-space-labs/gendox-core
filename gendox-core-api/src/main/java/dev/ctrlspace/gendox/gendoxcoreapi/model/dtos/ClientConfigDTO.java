package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

/**
 * What a client, such as the desktop app, needs to know to use this server.
 *
 * @param apiUrl               base URL of the API, ending in a slash
 * @param oidcAuthority        the OpenID Connect issuer users sign in with
 * @param desktopClientId      the public OIDC client of the desktop app
 * @param serverVersion        version of this server, or null when the build carries none
 * @param apiVersion           version of the API, as in its path
 * @param minDesktopAppVersion lowest desktop app version this server accepts
 */
public record ClientConfigDTO(
        String apiUrl,
        String oidcAuthority,
        String desktopClientId,
        String serverVersion,
        String apiVersion,
        String minDesktopAppVersion) {
}
