// src/LogoutComponent.js
import React, { useEffect } from 'react';
import userManager from 'src/services/authService';
import {isInIframe} from "../../utils/commonUtils";

const LogoutPage = () => {
    useEffect(() => {
        let signoutCallback = userManager.signoutRedirectCallback

        function handleSignoutSuccess() {
            console.log('User signed out successfully')
            userManager.removeUser(); // Clear user data
            window.location = "/";
        }

        function handleSignoutError(error) {
            console.error('Error during logout:', error);
            window.location = "/error";
        }

        if (isInIframe()) {
            userManager.signoutPopupCallback().then(() => {
                handleSignoutSuccess();
            }).catch(error => {
                handleSignoutError(error);
            });
        } else {
            userManager.signoutRedirectCallback().then(() => {
                handleSignoutSuccess();
            }).catch(error => {
                handleSignoutError(error);
            });
        }

    }, []);

    return (
        <div>Logging out...</div>
    );
}

export default LogoutPage;
