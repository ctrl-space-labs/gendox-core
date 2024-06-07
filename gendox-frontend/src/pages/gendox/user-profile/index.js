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
