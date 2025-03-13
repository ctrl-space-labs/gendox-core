// ** React Imports
import { useState } from 'react'
import Tab from '@mui/material/Tab'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Icon from 'src/views/custom-components/mui/icon/icon'


import GeneralProjectSettings from 'src/views/pages/project-settings-components/GeneralProjectSettings'
import MembersProjectSettings from 'src/views/pages/project-settings-components/MembersProjectSettings'
import AiAgentProjectSettings from 'src/views/pages/project-settings-components/AiAgentProjectSettings'

const ProjectSettingsCard = () => {
 
  // ** State for tabs
  const [value, setValue] = useState('general')  

  const handleTabsChange = (event, newValue) => {
    setValue(newValue)
  }

  return (
    <Card sx={{ backgroundColor: 'action.hover' }}>
      <CardHeader />
      <TabContext value={value}>
        <TabList
          variant='fullWidth'
          scrollButtons={false}
          onChange={handleTabsChange}
          sx={{ borderBottom: theme => `1px solid ${theme.palette.divider}` }}
        >
          <Tab
            value='general'
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Icon icon='mdi:cog' fontSize={20} />
                <Box component='span' sx={{ ml: 3 }}>
                  GENERAL
                </Box>
              </Box>
            }
          />

          <Tab
            value='members'
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Icon icon='mdi:account-group' fontSize={20} />
                <Box component='span' sx={{ ml: 3 }}>
                  MEMBERS
                </Box>
              </Box>
            }
          />

          <Tab
            value='ai-agent'
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Icon icon='mdi:robot' fontSize={20} />
                <Box component='span' sx={{ ml: 3 }}>
                  AI AGENT
                </Box>
              </Box>
            }
          />
        </TabList>

        <CardContent>
          <TabPanel value='general'>
            <GeneralProjectSettings />
          </TabPanel>

          <TabPanel value='members'>
            <MembersProjectSettings />
          </TabPanel>

          <TabPanel value='ai-agent'>
            <AiAgentProjectSettings />
          </TabPanel>
        </CardContent>
      </TabContext>
    </Card>
  )
}

export default ProjectSettingsCard
