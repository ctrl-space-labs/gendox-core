const commonConfig = {
    gendoxHomePage: "https://www.ctrlspace.dev/gendox",
    gendoxUrl: process.env.NEXT_PUBLIC_GENDOX_URL,
    oidcAuthority: process.env.NEXT_PUBLIC_OIDC_AUTHORITY,
    oidcClientId: process.env.NEXT_PUBLIC_OIDC_CLIENT_ID,
    oidcRedirectUri: process.env.NEXT_PUBLIC_OIDC_REDIRECT_URI,
    oidcPostLogoutRedirectUri: process.env.NEXT_PUBLIC_OIDC_POST_LOGOUT_REDIRECT_URI,
    oidcSilentRedirectUri: process.env.NEXT_PUBLIC_OIDC_SILENT_REDIRECT_URI,
    provenAiUrl: process.env.NEXT_PUBLIC_PROVEN_AI_URL,
    provenAiEnabled: process.env.NEXT_PUBLIC_PROVEN_AI_ENABLED? process.env.NEXT_PUBLIC_PROVEN_AI_ENABLED === 'true' : false /* true | false */,

}


export default commonConfig;