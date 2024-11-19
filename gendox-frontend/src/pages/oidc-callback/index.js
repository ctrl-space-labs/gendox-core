import React, {useContext, useEffect} from 'react';
import userManager from 'src/services/authService';
import BlankLayout from "../../@core/layouts/BlankLayout";
import {useAuth} from "src/hooks/useAuth"; // Ensure you have the correct path to your OIDC UserManager setup

const OidcCallbackPage = () => {
    const auth = useAuth();

    useEffect(() => {
        console.log('OidcCallbackPage mounted');


        // Handle the OIDC callback when the component mounts
        userManager.signinRedirectCallback()
            .then(() => {
                console.log('User signed in successfully! Waiting for user data to load...');

            })
            .catch(error => {
                // Log the error and redirect to an error page
                console.error('Error handling OIDC redirect callback:', error);
                // window.location.href = "/error";
            });
    }, []);

    return (
        <div>Loading...</div> // Display a loading message while processing the callback
    );
};

OidcCallbackPage.getLayout = page => <BlankLayout>{page}</BlankLayout>
OidcCallbackPage.guestGuard = true
export default OidcCallbackPage;
