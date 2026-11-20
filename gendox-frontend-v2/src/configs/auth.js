import commonConfig from 'src/configs/common.config.js'


const oidcConfig = {
  authority: commonConfig.oidcAuthority,
  client_id: commonConfig.oidcClientId,
  redirect_uri: commonConfig.oidcRedirectUri,
  response_type: "code",
  scope: commonConfig.oidcScope,
  post_logout_redirect_uri: commonConfig.oidcPostLogoutRedirectUri,
  silent_redirect_uri: commonConfig.oidcSilentRedirectUri,
  // Renews before the access token expires: with the refresh token when there is one, else in a hidden frame
  automaticSilentRenew: true,
  // Signing out revokes the tokens at the sign-in server (RFC 7009), not only here
  revokeTokensOnSignout: true,
  revokeTokenTypes: ['access_token', 'refresh_token'],
  pkceMethod: 'S256'
};

export default {
  oidcConfig: oidcConfig
}
