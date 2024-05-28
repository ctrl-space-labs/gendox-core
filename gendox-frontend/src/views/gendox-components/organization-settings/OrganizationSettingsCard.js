// ** React Imports
import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux';
import { useSettings } from "src/@core/hooks/useSettings";


// ** MUI Imports
import Tab from '@mui/material/Tab'
import Card from '@mui/material/Card'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import TabContext from '@mui/lab/TabContext'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import CardActions from '@mui/material/CardActions'
import Link from "next/link";
import Tooltip from "@mui/material/Tooltip";

import GeneralOrganizationSettings from 'src/views/gendox-components/organization-settings/GeneralOrganizationSettings'
import MembersOrganizationSettings from 'src/views/gendox-components/organization-settings/MembersOrganizationSettings'

const OrganizationSettingsCard = () => {

  
  const organization = useSelector((state) => state.activeOrganization.activeOrganization);
  

  // ** State for tabs
  const [value, setValue] = useState('general')

  const handleTabsChange = (event, newValue) => {
    setValue(newValue)
  }

  const { settings } = useSettings();
  const isDemo = settings.isDemo;

  return (
    <Card>
      <CardHeader title={organization.name} subheader='organization settings' />
      <TabContext value={value}>
        <TabList
          variant='scrollable'
          scrollButtons={false}
          onChange={handleTabsChange}
          sx={{ borderBottom: theme => `1px solid ${theme.palette.divider}` }}
        >
          <Tab value='general' label='GENERAL' />
          <Tab value='members' label='MEMBERS' />
          
        </TabList>

        <form onSubmit={e => e.preventDefault()}>
          <CardContent>
            <TabPanel value='general'>
              <GeneralOrganizationSettings />
            </TabPanel>

            <TabPanel value='members'>              
              <MembersOrganizationSettings  />
            </TabPanel>

            

          </CardContent>
          <Divider sx={{ m: '0 !important' }} />
          <CardActions sx={{ justifyContent: 'flex-end' }}>
          <Tooltip title={isDemo ? "Feature not available in demo mode" : ""}>
              <span>
                {/* Use a span to ensure Tooltip works correctly when the button is disabled */}
                <Button
                  size="large"
                  variant="contained"
                  component="a"
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
  )
}

export default OrganizationSettingsCard
