import { UserManager, WebStorageStateStore } from 'oidc-client-ts';

const config = {
    authority: "https://dev.gendox.ctrlspace.dev/idp/realms/gendox-idp-dev",
    // authority: "http://localhost:8090/realms/gendox-idp-dev",
    client_id: "gendox-pkce-public-client",
    redirect_uri: "http://localhost:3000/oidc-callback",
    response_type: "code",
    scope: "openid profile email",
    post_logout_redirect_uri: "http://localhost:3000/login",
    silent_redirect_uri: "http://localhost:3000/silent-renew",
    automaticSilentRenew: true,
    pkceMethod: 'S256'
};

let userManager = new UserManager(config);

if (typeof window !== 'undefined') {
    config.userStore = new WebStorageStateStore({ store: window.localStorage });
    userManager = new UserManager(config);
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
