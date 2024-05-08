
import React, { useEffect } from 'react';
import userManager from 'src/services/authService';
import LoginPage from "../login";
import BlankLayout from "../../@core/layouts/BlankLayout"; // Ensure you have the correct path to your OIDC UserManager setup

const OidcCallbackPage = () => {
    useEffect(() => {
        console.log('OidcCallbackPage mounted');
        // Handle the OIDC callback when the component mounts
        userManager.signinRedirectCallback()
            .then(() => {
                // Redirect to the home page after successful login
                window.location.href = "/gendox/home";
            })
            .catch(error => {
                // Log the error and redirect to an error page
                console.error('Error handling OIDC redirect callback:', error);
                window.location.href = "/error";
            });
    }, []);

    return (
        <div>Loading...</div> // Display a loading message while processing the callback
    );
};

OidcCallbackPage.getLayout = page => <BlankLayout>{page}</BlankLayout>
OidcCallbackPage.guestGuard = true
export default OidcCallbackPage;
