import { UserManager, WebStorageStateStore } from 'oidc-client-ts';
import authConfig from "src/configs/auth";



let userManager = new UserManager(authConfig.oidcConfig);

if (typeof window !== 'undefined') {
    authConfig.oidcConfig.userStore = new WebStorageStateStore({ store: window.localStorage });
    userManager = new UserManager(authConfig.oidcConfig);
}

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
