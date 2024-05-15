// // ** React Imports
// import { useState, useEffect } from 'react'

// // ** Next Import
// import { useRouter } from 'next/router'

// // ** MUI Components
// import Tab from '@mui/material/Tab'
// import Box from '@mui/material/Box'
// import Grid from '@mui/material/Grid'
// import TabPanel from '@mui/lab/TabPanel'
// import TabContext from '@mui/lab/TabContext'
// import Typography from '@mui/material/Typography'
// import { styled } from '@mui/material/styles'
// import useMediaQuery from '@mui/material/useMediaQuery'
// import MuiTabList from '@mui/lab/TabList'
// import CircularProgress from '@mui/material/CircularProgress'

// // ** Icon Imports
// import Icon from 'src/@core/components/icon'

// // ** Context
// import { useAuth } from "src/hooks/useAuth";
// import authConfig from "src/configs/auth";


// // // ** Demo Components
// // import Teams from 'src/views/pages/user-profile/teams'
// // import Profile from 'src/views/pages/user-profile/profile'
// // import Projects from 'src/views/pages/user-profile/projects'
// // import Connections from 'src/views/pages/user-profile/connections'
// import UserProfileHeader from 'src/views/gendox-components/user-profile/UserProfileHeader'
// import AboutProfile from 'src/views/gendox-components/user-profile/AboutProfile'

// const TabList = styled(MuiTabList)(({ theme }) => ({
//   '& .MuiTabs-indicator': {
//     display: 'none'
//   },
//   '& .Mui-selected': {
//     backgroundColor: theme.palette.primary.main,
//     color: `${theme.palette.common.white} !important`
//   },
//   '& .MuiTab-root': {
//     minWidth: 65,
//     minHeight: 38,
//     borderRadius: theme.shape.borderRadius,
//     [theme.breakpoints.up('sm')]: {
//       minWidth: 130
//     }
//   }
// }))

// const UserProfile = () => {
//   let tab ="profile"
//   // ** State
//   const [activeTab, setActiveTab] = useState(tab)
//   const [isLoading, setIsLoading] = useState(true)

//   // ** Hooks
//   const router = useRouter()
//   const {organizationId, userId} = router.query;
//   const auth = useAuth();
//   const hideText = useMediaQuery(theme => theme.breakpoints.down('sm'))

//   const handleChange = (event, value) => {
//     setIsLoading(true)
//     setActiveTab(value)
//     // router
//     //   .push({
//     //     pathname: `/gendox/user-profile/${value.toLowerCase()}`
//     //   })
//     //   .then(() => setIsLoading(false))
//     setIsLoading(false)
//   }
//   useEffect(() => {
//     if (auth) {
//       setIsLoading(false)
//     }
//   }, [auth])
//   useEffect(() => {
//     if (tab && tab !== activeTab) {
//       setActiveTab(tab)
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [tab])

//   const tabContentList = {
//     profile: <AboutProfile />,
//     // organizations: <Organizations data={auth} />,
//     // projects: <Projects data={auth} />,
//     // connections: <Connections data={auth} />
//   }

//   return (
//     <Grid container spacing={6}>
//       <Grid item xs={12}>
//         <UserProfileHeader />
//       </Grid>
//       {activeTab === undefined ? null : (
//         <Grid item xs={12}>
//           <TabContext value={activeTab}>
//             <Grid container spacing={6}>
//               <Grid item xs={12}>
//                 <TabList
//                   variant='scrollable'
//                   scrollButtons='auto'
//                   onChange={handleChange}
//                   aria-label='customized tabs example'
//                 >
//                   <Tab
//                     value='profile'
//                     label={
//                       <Box sx={{ display: 'flex', alignItems: 'center', ...(!hideText && { '& svg': { mr: 2 } }) }}>
//                         <Icon icon='mdi:account-outline' />
//                         {!hideText && 'Profile'}
//                       </Box>
//                     }
//                   />
//                   <Tab
//                     value='organizations'
//                     label={
//                       <Box sx={{ display: 'flex', alignItems: 'center', ...(!hideText && { '& svg': { mr: 2 } }) }}>
//                         <Icon icon='mdi:account-multiple-outline' />
//                         {!hideText && 'Organizations'}
//                       </Box>
//                     }
//                   />
//                   <Tab
//                     value='projects'
//                     label={
//                       <Box sx={{ display: 'flex', alignItems: 'center', ...(!hideText && { '& svg': { mr: 2 } }) }}>
//                         <Icon icon='mdi:view-grid-outline' />
//                         {!hideText && 'Projects'}
//                       </Box>
//                     }
//                   />
//                   <Tab
//                     value='connections'
//                     label={
//                       <Box sx={{ display: 'flex', alignItems: 'center', ...(!hideText && { '& svg': { mr: 2 } }) }}>
//                         <Icon icon='mdi:link-variant' />
//                         {!hideText && 'Connections'}
//                       </Box>
//                     }
//                   />
//                 </TabList>
//               </Grid>
//               <Grid item xs={12}>
//                 {isLoading ? (
//                   <Box sx={{ mt: 6, display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
//                     <CircularProgress sx={{ mb: 4 }} />
//                     <Typography>Loading...</Typography>
//                   </Box>
//                 ) : (
//                   <TabPanel sx={{ p: 0 }} value={activeTab}>
//                     {tabContentList[activeTab]}
//                   </TabPanel>
//                 )}
//               </Grid>
//             </Grid>
//           </TabContext>
//         </Grid>
//       )}
//     </Grid>
//   )
// }

// export default UserProfile


// ** MUI Imports
import Grid from '@mui/material/Grid'
import { useRouter } from 'next/router'
import { useAuth } from "src/hooks/useAuth";

// ** Demo Components Imports
import UserViewLeft from 'src/views/gendox-components/user-profile/UserViewLeft'
import UserViewRight from 'src/views/gendox-components/user-profile/UserViewRight'

const UserProfile = () => {
  const router = useRouter()
  const {organizationId, userId} = router.query;
  const auth = useAuth();
  return (
    <Grid container spacing={6}>
      <Grid item xs={12} md={5} lg={4}>
        <UserViewLeft userData={auth.user}/>
      </Grid>
      <Grid item xs={12} md={7} lg={8}>
        <UserViewRight  userData={auth.user} />
      </Grid>
    </Grid>
  )
}

export default UserProfile
