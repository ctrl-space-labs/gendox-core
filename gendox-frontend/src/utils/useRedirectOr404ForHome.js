import { useEffect } from "react";
import { useRouter } from "next/router";
import authConfig from "src/configs/auth";

const useRedirectOr404ForHome = (organizationId, projectId) => {
  const router = useRouter();

  useEffect(() => {
    const storedOrgId =
      organizationId ||
      window.localStorage.getItem(authConfig.selectedOrganizationId);
    const storedProjId =
      projectId || window.localStorage.getItem(authConfig.selectedProjectId);

    const effectiveOrgId = organizationId || storedOrgId;
    const effectiveProjId = projectId || storedProjId;

    if (!effectiveOrgId || !effectiveProjId) {
      router.push("/404");
    } else if (!organizationId || !projectId) {
      router.push(
        `/gendox/home/?organizationId=${effectiveOrgId}&projectId=${effectiveProjId}`
      );
    }
  }, [organizationId, projectId, router]);
};

export default useRedirectOr404ForHome;
