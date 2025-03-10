import Grid from '@mui/material/Grid'
import { useRouter } from 'next/router'
import { useAuth } from "src/authentication/useAuth";
import OrgProjectTab from 'src/views/pages/user-profile/OrgProjectTab'
import ProfileCard from "src/views/pages/user-profile/ProfileCard";

const UserProfile = () => {
  const auth = useAuth();
  return (
    <Grid container spacing={6}>
      <Grid item xs={12} md={5} lg={4}>
        <ProfileCard userData={auth.user}/>
      </Grid>
      <Grid item xs={12} md={7} lg={8}>
        <OrgProjectTab userData={auth.user} />
      </Grid>
    </Grid>
  )
}

export default UserProfile
