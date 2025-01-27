import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "src/hooks/useAuth";
import authConfig from "src/configs/auth";

const useRedirectOr404ForHome = (organizationId, projectId) => {
  const router = useRouter();
  const auth  = useAuth();

  useEffect(() => {
    if (!auth.user) return; // Ensure user is available before proceeding

    // Check if user has organizations
    if (!Array.isArray(auth.user.organizations) || auth.user.organizations.length === 0) {
      router.push("/gendox/create-organization");
      return;
    }

    const storedOrgId =
      organizationId ||
      window.localStorage.getItem(authConfig.selectedOrganizationId);
    const storedProjId =
      projectId || window.localStorage.getItem(authConfig.selectedProjectId);

    const effectiveOrgId = organizationId || storedOrgId;
    const effectiveProjId = projectId || storedProjId;    

    if (!effectiveOrgId && !effectiveProjId) {
      router.push("/404");
    } else if (!effectiveProjId || effectiveProjId === "null") {
      router.push(
        `/gendox/create-project/?organizationId=${effectiveOrgId}`
      );
    } else if (!organizationId || !projectId) {
      router.push(
        `/gendox/home/?organizationId=${effectiveOrgId}&projectId=${effectiveProjId}`
      );
    }
  }, [organizationId, projectId, router]);
};

export default useRedirectOr404ForHome;
