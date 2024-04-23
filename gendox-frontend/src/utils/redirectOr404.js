import { useEffect } from "react";
import { useRouter } from "next/router";
import authConfig from "src/configs/auth";

const useRedirectOr404ForHome = () => {
  const router = useRouter();

  
    const storedOrgId = window.localStorage.getItem(
      authConfig.selectedOrganizationId
    );
    const storedProjId = window.localStorage.getItem(
      authConfig.selectedProjectId
    );

    if (storedOrgId && storedProjId) {
      router.push(
        `/gendox/home?organizationId=${storedOrgId}&projectId=${storedProjId}`
      );
    } else {
      router.push("/404");
    }
  
};

export default useRedirectOr404ForHome;
