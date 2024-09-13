import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import ProjectSettingsCard from "src/views/gendox-components/project-settings-components/ProjectSettingsCard";
import { useAuth } from "src/hooks/useAuth";
import authConfig from "src/configs/auth";
import { fetchOrganization } from "src/store/apps/activeOrganization/activeOrganization";
import { fetchProject } from "src/store/apps/activeProject/activeProject";
import { StyledCardContent } from "src/utils/styledCardsContent";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const ProjectSettings = () => {
  const auth = useAuth();
  const dispatch = useDispatch();
  const router = useRouter();
  const { organizationId, projectId } = router.query;
  const [isBlurring, setIsBlurring] = useState(false);

  const project = useSelector((state) => state.activeProject.projectDetails);

  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );
 

  useEffect(() => {
    if (organizationId && projectId && storedToken) {
      dispatch(fetchOrganization({ organizationId, storedToken }));
      dispatch(fetchProject({ organizationId, projectId, storedToken }));
    }
  }, [organizationId, projectId, storedToken, dispatch]);

  useEffect(() => {
    const loadProjectDetails = async () => {
      if (projectId && organizationId) {
        setIsBlurring(true);
        const activeOrganization = auth.user.organizations.find(
          (org) => org.id === organizationId
        );
        const selectedProject = activeOrganization.projects.find(
          (proj) => proj.id === projectId
        );

        if (!selectedProject) {
          setError("Project not found in the selected organization.");
          setTimeout(() => {
            setIsBlurring(false); // Remove blur effect after 300ms
          }, 300);
          return;
        } else {
          setTimeout(() => {
            setIsBlurring(false); // Remove blur effect after 300ms
          }, 300);
        }
      }
    };
    loadProjectDetails();
  }, [auth, organizationId, projectId]);

  return (
    <Card
      sx={{
        backgroundColor: "transparent",
        boxShadow: "none",
        filter: isBlurring ? "blur(6px)" : "none",
        transition: "filter 0.3s ease",
      }}
    >
      <StyledCardContent sx={{ backgroundColor: "background.paper" }}>
        <Box sx={{ textAlign: "left" }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              color: "text.secondary",
              mb: 2,
            }}
          >
            Project Settings
          </Typography>
          <Typography
            variant="h6"
            sx={{ fontWeight: 400, color: "primary.main" }}
          >
            {project?.name || "No Selected"}
          </Typography>
        </Box>
      </StyledCardContent>
      <Box sx={{ height: 20 }} />

      <ProjectSettingsCard />
    </Card>
  );
};

export default ProjectSettings;
