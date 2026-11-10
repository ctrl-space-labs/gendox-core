import { UserManager, WebStorageStateStore } from 'oidc-client-ts';
import authConfig from "src/configs/auth";

const localStorageStore = typeof window !== 'undefined'
    ? new WebStorageStateStore({ store: window.localStorage })
    : undefined;

const userManager = new UserManager({
    ...authConfig.oidcConfig,
    ...(localStorageStore ? { userStore: localStorageStore, stateStore: localStorageStore } : {})
});

// automaticSilentRenew (configs/auth) renews the token before it expires; a second signinSilent here renewed it twice,
// and each renewal reloads the profile and every page's data
userManager.events.addSilentRenewError(err => {
    console.error('Failed to renew access token:', err);
});

userManager.events.addUserSignedOut(() => {
    console.log('User signed out.');
});

export default userManager;
