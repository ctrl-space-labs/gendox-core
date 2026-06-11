const commonConfig = {
    gendoxHomePage: "https://gendox.dev/",
    gendoxDocsUrl: process.env.NEXT_PUBLIC_GENDOX_DOCS_URL || "https://ctrl-space-labs.github.io",
    gendoxUrl: process.env.NEXT_PUBLIC_GENDOX_URL,
    oidcAuthority: process.env.NEXT_PUBLIC_OIDC_AUTHORITY,
    oidcClientId: process.env.NEXT_PUBLIC_OIDC_CLIENT_ID,
    oidcRedirectUri: process.env.NEXT_PUBLIC_OIDC_REDIRECT_URI,
    oidcPostLogoutRedirectUri: process.env.NEXT_PUBLIC_OIDC_POST_LOGOUT_REDIRECT_URI,
    oidcSilentRedirectUri: process.env.NEXT_PUBLIC_OIDC_SILENT_REDIRECT_URI,
    provenAiUrl: process.env.NEXT_PUBLIC_PROVEN_AI_URL,
    provenAiEnabled: process.env.NEXT_PUBLIC_PROVEN_AI_ENABLED? process.env.NEXT_PUBLIC_PROVEN_AI_ENABLED === 'true' : false /* true | false */,
    GEE_clientId: process.env.NEXT_PUBLIC_GEE_CLIENT_ID
}


export default commonConfig;
