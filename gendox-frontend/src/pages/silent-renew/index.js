
import React, { useEffect } from 'react';
import userManager from "src/services/authService";

const SilentRenewPage = () => {
    // This is handled by AuthProvider
    useEffect(() => {
        console.log('Silently Renewing session...');
        userManager.signinSilentCallback().catch(error => {
            console.error('Silent sign-in error:', error);
        });
    }, []);

    return (
        <div>
            Renewing session...
        </div>
    );
};

export default SilentRenewPage;
