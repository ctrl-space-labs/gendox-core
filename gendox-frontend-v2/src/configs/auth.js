import commonConfig from 'src/configs/common.config.js'


const oidcConfig = {
  authority: commonConfig.oidcAuthority,
  client_id: commonConfig.oidcClientId,
  redirect_uri: commonConfig.oidcRedirectUri,
  response_type: "code",
  scope: "openid profile email",
  post_logout_redirect_uri: commonConfig.oidcPostLogoutRedirectUri,
  silent_redirect_uri: commonConfig.oidcSilentRedirectUri,
  automaticSilentRenew: true,
  pkceMethod: 'S256'
};

export default {
  oidcConfig: oidcConfig
}
