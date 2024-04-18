import { useAuth } from "src/hooks/useAuth";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { activeProjectActions } from "src/store/apps/activeProject/activeProject";

// ** Icon Imports
import Icon from "src/@core/components/icon";

// ** Config
import authConfig from "src/configs/auth";

const Navigation = () => {
  const auth = useAuth();
  const dispatch = useDispatch();
  const [navigationItems, setNavigationItems] = useState([]);

  const router = useRouter();
  const { organizationId, projectId } = router.query;

  useEffect(() => {
    if (auth.user && auth.user.organizations) {
      const activeOrganization = auth.user.organizations.find(
        (org) => org.id === organizationId
      );
      if (activeOrganization && activeOrganization.projects) {
        const projects = activeOrganization.projects.map((project) => {
          return {
            title: project.name,
            path: `/gendox/home?organizationId=${activeOrganization.id}&projectId=${project.id}`,

            // children: [
            //   {
            //     icon: 'mdi:cog-outline',
            //     path: `/gendox/project-settings?organizationId=${activeOrganization.id}&projectId=${project.id}`
            //   }
            // ]
          };
        });

        setNavigationItems([
          {
            sectionTitle: "Projects",
          },
          ...projects,
          {
            icon: "mdi:cog-outline",
            path: `/gendox/project-settings?organizationId=${activeOrganization.id}&projectId=${projectId}`,
          },
          {
            icon: "mdi:chat",
            path: `/gendox/chat?organizationId=${activeOrganization.id}&projectId=${projectId}`,
          },
        ]);
      }
    }
  }, [auth, organizationId, projectId, dispatch, router]);

  return navigationItems;
};

export default Navigation;
