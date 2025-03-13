import {useEffect, useState} from "react";
import { useAuth } from "src/authentication/useAuth";
import BlankLayout from "src/@core/layouts/BlankLayout";
import {routeTypes} from "../../authentication/components/RouteHandler";

const LoginPage = () => {
  // ** Hooks
  const auth = useAuth();

    useEffect(() => {
        auth.login();
    }, []);

  return (
      <div>Logging in...</div>
  )
};


LoginPage.getLayout = (page) => <BlankLayout>{page}</BlankLayout>;
LoginPage.pageConfig = {
  routeType: routeTypes.publicOnly,
};

export default LoginPage;
