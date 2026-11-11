// Set by /env-config.js when one image serves several environments. Empty otherwise,
// so a build keeps the values inlined at build time.
const runtimeEnv = (typeof window !== 'undefined' && window.__GENDOX_ENV__) || {}

const commonConfig = {
    gendoxHomePage: "https://gendox.dev/",
    gendoxDocsUrl: process.env.NEXT_PUBLIC_GENDOX_DOCS_URL || "https://docs.gendox.dev",
    gendoxSupportUrl: process.env.NEXT_PUBLIC_GENDOX_SUPPORT_URL || "https://gendox.dev/contact/",
    gendoxUrl: runtimeEnv.NEXT_PUBLIC_GENDOX_URL || process.env.NEXT_PUBLIC_GENDOX_URL,
    oidcAuthority: runtimeEnv.NEXT_PUBLIC_OIDC_AUTHORITY || process.env.NEXT_PUBLIC_OIDC_AUTHORITY,
    oidcClientId: runtimeEnv.NEXT_PUBLIC_OIDC_CLIENT_ID || process.env.NEXT_PUBLIC_OIDC_CLIENT_ID,
    oidcRedirectUri: runtimeEnv.NEXT_PUBLIC_OIDC_REDIRECT_URI || process.env.NEXT_PUBLIC_OIDC_REDIRECT_URI,
    oidcPostLogoutRedirectUri: runtimeEnv.NEXT_PUBLIC_OIDC_POST_LOGOUT_REDIRECT_URI || process.env.NEXT_PUBLIC_OIDC_POST_LOGOUT_REDIRECT_URI,
    oidcSilentRedirectUri: runtimeEnv.NEXT_PUBLIC_OIDC_SILENT_REDIRECT_URI || process.env.NEXT_PUBLIC_OIDC_SILENT_REDIRECT_URI,
    provenAiUrl: process.env.NEXT_PUBLIC_PROVEN_AI_URL,
    provenAiEnabled: process.env.NEXT_PUBLIC_PROVEN_AI_ENABLED? process.env.NEXT_PUBLIC_PROVEN_AI_ENABLED === 'true' : false /* true | false */,
    GEE_clientId: process.env.NEXT_PUBLIC_GEE_CLIENT_ID
}


export default commonConfig;
