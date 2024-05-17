// ** React Imports
import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux';

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

import GeneralOrganizationSettings from 'src/views/gendox-components/organization-settings/GeneralOrganizationSettings'
import MembersOrganizationSettings from 'src/views/gendox-components/organization-settings/MembersOrganizationSettings'

const OrganizationSettingsCard = () => {

  
  const organization = useSelector((state) => state.activeOrganization.activeOrganization);
  

  // ** State for tabs
  const [value, setValue] = useState('general')

  const handleTabsChange = (event, newValue) => {
    setValue(newValue)
  }

  // Function to navigate to ProvenAi
  const navigateToProvenAi = () => {
    window.open('https://www.ctrlspace.dev/', '_blank');
  };

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
            <Button size='large' onClick={navigateToProvenAi} variant='contained'>
              Go to ProvenAi
            </Button>
          </CardActions>
        </form>
      </TabContext>
    </Card>
  )
}

export default OrganizationSettingsCard
