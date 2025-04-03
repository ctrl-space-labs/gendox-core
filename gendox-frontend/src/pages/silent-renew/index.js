
import React, { useEffect } from 'react';
import userManager from "src/services/authService";
import BlankLayout from "../../@core/layouts/BlankLayout";
import {routeTypes} from "../../authentication/components/RouteHandler";

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

SilentRenewPage.getLayout = page => <BlankLayout>{page}</BlankLayout>
SilentRenewPage.pageConfig = {
  routeType: routeTypes.publicOnly,
}

export default SilentRenewPage;
