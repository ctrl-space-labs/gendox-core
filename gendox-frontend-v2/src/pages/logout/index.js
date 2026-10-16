// src/LogoutComponent.js
import React, { useEffect } from 'react';
import userManager from 'src/services/authService';

const LogoutPage = () => {
    useEffect(() => {
        userManager.signoutRedirectCallback().then(() => {
            console.log('User signed out successfully')
            userManager.removeUser(); // Clear user data
            window.location = "/";
        }).catch(error => {
            console.error('Error during logout:', error);
            window.location = "/error";
        });
    }, []);

    return (
        <div>Logging out...</div>
    );
}

export default LogoutPage;
