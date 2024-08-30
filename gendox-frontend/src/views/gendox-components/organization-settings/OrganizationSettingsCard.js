// ** React Imports
import { useState } from "react";


// ** MUI Imports
import Tab from "@mui/material/Tab";
import Card from "@mui/material/Card";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Box from "@mui/material/Box";
import TabContext from "@mui/lab/TabContext";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Icon from "src/@core/components/icon";

import GeneralOrganizationSettings from "src/views/gendox-components/organization-settings/GeneralOrganizationSettings";
import MembersOrganizationSettings from "src/views/gendox-components/organization-settings/MembersOrganizationSettings";
import PlansOrganizationSettings from "src/views/gendox-components/organization-settings/PlansOrganizationSettings";

const OrganizationSettingsCard = () => { 

  // ** State for tabs
  const [value, setValue] = useState("general");

  const handleTabsChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Card sx={{ backgroundColor: "action.hover" }}>
      <CardHeader />
      <TabContext value={value}>
        <TabList
          variant="fullWidth"
          scrollButtons={false}
          onChange={handleTabsChange}
          sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}
        >
          <Tab
            value="general"
            label={
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Icon icon="mdi:cog" fontSize={20} />
                <Box component="span" sx={{ ml: 3 }}>
                  GENERAL
                </Box>
              </Box>
            }
          />
          <Tab
            value="members"
            label={
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Icon icon="mdi:account-group" fontSize={20} />
                <Box component="span" sx={{ ml: 3 }}>
                  MEMBERS
                </Box>
              </Box>
            }
          />
          <Tab
            value="plans"
            label={
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Icon icon="mdi:cash-sync" fontSize={20} />
                <Box component="span" sx={{ ml: 3 }}>
                  PLANS
                </Box>
              </Box>
            }
          />
        </TabList>

        <CardContent>
          <TabPanel value="general">
            <GeneralOrganizationSettings />
          </TabPanel>

          <TabPanel value="members">
            <MembersOrganizationSettings />
          </TabPanel>

          <TabPanel value="plans">
            <PlansOrganizationSettings />
          </TabPanel>
        </CardContent>
      </TabContext>
    </Card>
  );
};

export default OrganizationSettingsCard;
