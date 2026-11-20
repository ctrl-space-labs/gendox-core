import { UserManager, WebStorageStateStore } from 'oidc-client-ts';
import authConfig from "src/configs/auth";
import desktopBridge, { isDesktopApp } from 'src/services/desktopBridge';

const localStorageStore = typeof window !== 'undefined'
    ? new WebStorageStateStore({ store: window.localStorage })
    : undefined;

// In the desktop app, sign-in and sign-out pages open in the system browser (OAuth 2.0 for Native Apps,
// RFC 8252), where the user's passwords, single sign-on and Google or Microsoft accounts are. This
// navigator takes the place of the popup window: the app opens the page and waits for the browser to come
// back to a loopback address; oidc-client-ts does the rest of the flow (PKCE, state, code exchange) as for
// any popup. The address comes from the app for each sign-in, so these are placeholders.
const desktopApp = typeof window !== 'undefined' && isDesktopApp();
const systemBrowserNavigator = {
    prepare: async () => ({
        navigate: async ({ url }) => ({ url: await desktopBridge.openSignIn(url) }),
        close: () => {
            desktopBridge.cancelSignIn().catch(() => {});
        }
    }),
    callback: async () => {}
};

const userManager = new UserManager(
    {
        ...authConfig.oidcConfig,
        ...(localStorageStore ? { userStore: localStorageStore, stateStore: localStorageStore } : {}),
        ...(desktopApp
            ? { popup_redirect_uri: 'http://127.0.0.1/callback', popup_post_logout_redirect_uri: 'http://127.0.0.1/callback' }
            : {})
    },
    undefined,
    desktopApp ? systemBrowserNavigator : undefined
);

// automaticSilentRenew (configs/auth) renews the token before it expires; a second signinSilent here renewed it twice,
// and each renewal reloads the profile and every page's data
userManager.events.addSilentRenewError(err => {
    console.error('Failed to renew access token:', err);
});

userManager.events.addUserSignedOut(() => {
    console.log('User signed out.');
});

/** Desktop app: signs in through the system browser. Resolves with the user once the browser comes back. */
export async function signInWithBrowser() {
    const redirect_uri = await desktopBridge.prepareSignIn();
    return userManager.signinPopup({ redirect_uri });
}

/** Desktop app: revokes the tokens and ends the session at the sign-in server, through the system browser. */
export async function signOutWithBrowser() {
    const post_logout_redirect_uri = await desktopBridge.prepareSignIn();
    return userManager.signoutPopup({ post_logout_redirect_uri });
}

export const cancelBrowserSignIn = () => desktopBridge.cancelSignIn();

export default userManager;
