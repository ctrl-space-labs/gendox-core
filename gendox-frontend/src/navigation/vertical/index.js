import {useEffect, useState} from "react";
import {useAuth} from "../../authentication/useAuth";
import {useRouter} from "next/router";
import {sortByField} from "../../utils/orderUtils";

const navigation = () => {
  const auth = useAuth();
  const router = useRouter();
  const { organizationId, projectId } = router.query;
  const [navigationItems, setNavigationItems] = useState([]);


  useEffect(() => {
    if (auth.user && auth.user.organizations) {
      const activeOrganization = auth.user.organizations.find(
        (org) => org.id === organizationId
      );
      if (activeOrganization && activeOrganization.projects) {
        const projects = activeOrganization.projects.map((project) => {
          return {
            title: project.name,
            icon: "mdi:view-grid-outline",
            path: `/gendox/home/?organizationId=${activeOrganization.id}&projectId=${project.id}`,
            itemId: project.id,
          };
        });

        const sortedProjects = sortByField(projects, "title", projectId);

        setNavigationItems([
          {
            sectionTitle: "PROJECTS",
          },
          ...sortedProjects,
        ]);
      }
    }
  }, [auth, organizationId, router, projectId]);

  return navigationItems;
}

export default navigation
