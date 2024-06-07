// ** React Imports
import { useState, useEffect } from 'react'

// ** Next Import
import { useRouter } from 'next/router'

// ** MUI Imports
import Box from '@mui/material/Box'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import MuiTab from '@mui/material/Tab'
import CircularProgress from '@mui/material/CircularProgress'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Demo Components Imports
import UserViewOverviewOrganizations from 'src/views/gendox-components/user-profile/UserViewOverviewOrganizations'
import UserViewOverviewProjects from 'src/views/gendox-components/user-profile/UserViewOverviewProjects'

// ** Styled Tab component
const Tab = styled(MuiTab)(({ theme }) => ({
  minHeight: 48,
  flexDirection: 'row',
  '& svg': {
    marginBottom: '0 !important',
    marginRight: theme.spacing(1)
  }
}))

const UserViewRight = ({ userData }) => {
  // ** State
  const [activeTab, setActiveTab] = useState('organizations')
  const [isLoading, setIsLoading] = useState(false)

  // ** Hooks
  const router = useRouter()

  const handleChange = (event, value) => {
    setIsLoading(true)
    setActiveTab(value)
    // router
    //   .push({
    //     pathname: `/apps/user/view/${value.toLowerCase()}`
    //   })
    //   .then(() => setIsLoading(false))
    setIsLoading(false)
  }
  // useEffect(() => {
  //   if (tab && tab !== activeTab) {
  //     setActiveTab(tab)
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [tab])
  // useEffect(() => {
  //   if (invoiceData) {
  //     setIsLoading(false)
  //   }
  // }, [invoiceData])

  return (
    <TabContext value={activeTab}>
      <TabList
        variant='scrollable'
        scrollButtons='auto'
        onChange={handleChange}
        aria-label='forced scroll tabs example'
        sx={{ borderBottom: theme => `1px solid ${theme.palette.divider}` }}
      >
        <Tab value='organizations' label='organizations' icon={<Icon icon='mdi:account-outline' />} />
        <Tab value='projects' label='projects' icon={<Icon icon='mdi:lock-outline' />} />
        
      </TabList>
      <Box sx={{ mt: 6 }}>
        {isLoading ? (
          <Box sx={{ mt: 6, display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
            <CircularProgress sx={{ mb: 4 }} />
            <Typography>Loading...</Typography>
          </Box>
        ) : (
          <>
            <TabPanel sx={{ p: 0 }} value='organizations'>
              <UserViewOverviewOrganizations userData={userData} />
            </TabPanel>
            <TabPanel sx={{ p: 0 }} value='projects'>
              <UserViewOverviewProjects userData={userData}/>
            </TabPanel>
            
          </>
        )}
      </Box>
    </TabContext>
  )
}

export default UserViewRight
