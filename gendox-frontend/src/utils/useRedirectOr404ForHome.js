import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from 'src/authentication/useAuth'
import { localStorageConstants } from 'src/utils/generalConstants'

const useRedirectOr404ForHome = (urlOrgId, urlProjId) => {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    //////    Organizations Validation   //////
    const organizations = user.organizations;
    if (!organizations || organizations.length === 0) {
      router.push('/gendox/create-organization');
      return;
    }

    // Validate URL organization ID before computing effective organization.
    if (urlOrgId && !organizations.find(o => o.id === urlOrgId)) {
      router.push('/404');
      return;
    }

    const localOrgId = window.localStorage.getItem(localStorageConstants.selectedOrganizationId);
    const candidateOrgId = urlOrgId || localOrgId;
    const effectiveOrg = organizations.find(o => o.id === candidateOrgId) || organizations[0];
    window.localStorage.setItem(localStorageConstants.selectedOrganizationId, effectiveOrg.id);

    //////    Projects Validation   //////
    const projects = effectiveOrg.projects;
    if (!projects || projects.length === 0) {
      router.push(`/gendox/create-project/?organizationId=${effectiveOrg.id}`);
      return;
    }

    // Validate URL project ID before computing effective project.
    if (urlProjId && !projects.find(p => p.id === urlProjId)) {
      router.push('/404');
      return;
    }

    const localProjId = window.localStorage.getItem(localStorageConstants.selectedProjectId);
    const candidateProjId = urlProjId || localProjId;
    const effectiveProj = projects.find(p => p.id === candidateProjId) || projects[0];
    window.localStorage.setItem(localStorageConstants.selectedProjectId, effectiveProj.id);

    // update the url only if the effective organization or project is different from the original URL.
    if (urlOrgId !== effectiveOrg.id || urlProjId !== effectiveProj.id) {
      router.push(`/gendox/home/?organizationId=${effectiveOrg.id}&projectId=${effectiveProj.id}`);
    }
  }, [urlOrgId, urlProjId, router, user]);
};

export default useRedirectOr404ForHome
