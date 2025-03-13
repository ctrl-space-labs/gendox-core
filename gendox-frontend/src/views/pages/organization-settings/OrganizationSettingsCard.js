// ** React Imports
import { useState, useEffect } from "react";

// ** MUI Imports
import Tab from "@mui/material/Tab";
import Card from "@mui/material/Card";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Box from "@mui/material/Box";
import TabContext from "@mui/lab/TabContext";
import CardContent from "@mui/material/CardContent";
import Icon from "src/views/custom-components/mui/icon/icon";


import GeneralOrganizationSettings from "src/views/pages/organization-settings/GeneralOrganizationSettings";
import MembersOrganizationSettings from "src/views/pages/organization-settings/MembersOrganizationSettings";
import AdvancedOrganizationSettings from "src/views/pages/organization-settings/AdvancedOrganizationSettings";

const OrganizationSettingsCard = () => {
  

  const [value, setValue] = useState("general");

  

  const handleTabsChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Card sx={{ backgroundColor: "action.hover", pt: '2rem' }} >
      <TabContext value={value} >
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
                <Icon icon="mdi:settings" fontSize={20} />
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
            value="advancedSettings"
            label={
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Icon icon="mdi:hammer-wrench" fontSize={20} />
                <Box component="span" sx={{ ml: 3 }}>
                  ADVANCED SETTINGS
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
            <MembersOrganizationSettings/>
          </TabPanel>

          <TabPanel value="advancedSettings">
            <AdvancedOrganizationSettings />
          </TabPanel>
        </CardContent>
      </TabContext>
    </Card>
  );
};

export default OrganizationSettingsCard;
