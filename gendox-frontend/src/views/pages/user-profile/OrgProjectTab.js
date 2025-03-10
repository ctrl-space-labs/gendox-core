import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import {styled, useTheme} from '@mui/material/styles'
import Tab from '@mui/material/Tab'

import Icon from 'src/views/custom-components/mui/icon/icon'
import UserOrganizationTab from 'src/views/pages/user-profile/UserOrganizationTab'
import UserViewOverviewProjects from 'src/views/pages/user-profile/UserViewOverviewProjects'


const OrgProjectTab = ({ userData }) => {
  const [activeTab, setActiveTab] = useState('organizations')
  const [isLoading, setIsLoading] = useState(false)
  const theme = useTheme()

  const handleChange = (event, value) => {
    setIsLoading(true)
    setActiveTab(value)
    setIsLoading(false)
  }

  return (
    <TabContext value={activeTab}>
      <TabList
        onChange={handleChange}
        sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
      >
        <Tab
          value="organizations"
          label={
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Icon icon="mdi:domain" fontSize={20} />
              <Box component="span" sx={{ ml: 3 }}>
                ORGANIZATIONS
              </Box>
            </Box>
          }
        />

        <Tab
          value="projects"
          label={
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Icon icon="mdi:briefcase-variant-outline" fontSize={20} />
              <Box component="span" sx={{ ml: 3 }}>
                PROJECTS
              </Box>
            </Box>
          }
        />

      </TabList>
      <Box sx={{
        filter: isLoading ? "blur(6px)" : "none",
        transition: "filter 0.3s ease",
        mt: 6
      }}>
        <TabPanel sx={{p: 0}} value='organizations'>
          <UserOrganizationTab userData={userData}/>
        </TabPanel>
        <TabPanel sx={{p: 0}} value='projects'>
          <UserViewOverviewProjects userData={userData}/>
        </TabPanel>

      </Box>
    </TabContext>
  )
}

export default OrgProjectTab
