// ** React Imports
import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";

// ** Hooks
import { useSettings } from "src/@core/hooks/useSettings";

// ** MUI Imports
import Tab from "@mui/material/Tab";
import Card from "@mui/material/Card";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import TabContext from "@mui/lab/TabContext";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import CardActions from "@mui/material/CardActions";
import Link from "next/link";
import Tooltip from "@mui/material/Tooltip";

// ** Project Setting Components Imports
import GeneralProjectSettings from "src/views/gendox-components/project-settings-components/GeneralProjectSettings";
import MembersProjectSettings from "src/views/gendox-components/project-settings-components/MembersProjectSettings";
import AiAgentProjectSettings from "src/views/gendox-components/project-settings-components/AiAgentProjectSettings";

const ProjectSettingsCard = () => {
  const project = useSelector((state) => state.activeProject.projectDetails);

  const { settings } = useSettings();
  const isDemo = settings.isDemo;

  // ** State for tabs
  const [value, setValue] = useState("general");

  const handleTabsChange = (event, newValue) => {
    setValue(newValue);
  };

 
  return (
    <Card>
      <CardHeader title={project.name} subheader="project settings" />
      <TabContext value={value}>
        <TabList
          variant="scrollable"
          scrollButtons={false}
          onChange={handleTabsChange}
          sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}
        >
          <Tab value="general" label="GENERAL" />
          <Tab value="members" label="MEMBERS" />
          <Tab value="ai-agent" label="AI AGENT" />
        </TabList>

        <form onSubmit={(e) => e.preventDefault()}>
          <CardContent>
            <TabPanel value="general">
              <GeneralProjectSettings project={project} />
            </TabPanel>

            <TabPanel value="members">
              <MembersProjectSettings project={project} />
            </TabPanel>

            <TabPanel value="ai-agent">
              <AiAgentProjectSettings project={project} />
            </TabPanel>
          </CardContent>
          <Divider sx={{ m: "0 !important" }} />
          <CardActions sx={{ justifyContent: "flex-end" }}>
            <Tooltip title={isDemo ? "Feature not available in demo mode" : ""}>
              <span>
                {/* Use a span to ensure Tooltip works correctly when the button is disabled */}
                <Button
                  size="large"
                  variant="contained"                  
                  href="https://www.ctrlspace.dev/"
                  target="_blank"
                  rel="noopener noreferrer"
                  disabled={isDemo} // Disable the button if isDemo is true
                >
                  Go to ProvenAi
                </Button>
              </span>
            </Tooltip>
          </CardActions>
        </form>
      </TabContext>
    </Card>
  );
};

export default ProjectSettingsCard;
