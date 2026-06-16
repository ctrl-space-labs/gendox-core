import { UserManager, WebStorageStateStore } from 'oidc-client-ts';
import authConfig from "src/configs/auth";

const localStorageStore = typeof window !== 'undefined'
    ? new WebStorageStateStore({ store: window.localStorage })
    : undefined;

const userManager = new UserManager({
    ...authConfig.oidcConfig,
    ...(localStorageStore ? { userStore: localStorageStore, stateStore: localStorageStore } : {})
});

userManager.events.addAccessTokenExpiring(() => {
    console.log('Access token is expiring... Trying to renew...');
    userManager.signinSilent().then(newUser => {
        console.log('Successfully renewed access token.');
    }).catch(err => {
        console.error('Failed to renew access token:', err);
    });
});

userManager.events.addUserSignedOut(() => {
    console.log('User signed out.');
});

export default userManager;
