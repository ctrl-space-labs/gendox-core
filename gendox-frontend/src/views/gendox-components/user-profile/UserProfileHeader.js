// ** React Imports
import { useState, useEffect } from 'react'

// ** MUI Components
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import { styled } from '@mui/material/styles'
import CardMedia from '@mui/material/CardMedia'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'

// ** Third Party Imports
import axios from 'axios'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { useAuth } from "src/hooks/useAuth";


const ProfilePicture = styled('img')(({ theme }) => ({
  width: 120,
  height: 120,
  borderRadius: theme.shape.borderRadius,
  border: `5px solid ${theme.palette.common.white}`,
  [theme.breakpoints.down('md')]: {
    marginBottom: theme.spacing(4)
  }
}))

const UserProfileHeader = () => {
  // ** State
  
  const auth = useAuth();
  const [data, setData] = useState(auth)
  console.log("data", data)
 
  const designationIcon = data?.designationIcon || 'mdi:briefcase-outline'

  return data !== null ? (
    <Card>
      
      <CardContent
        sx={{
          pt: 0,
          mt: 4,
          display: 'flex',
          alignItems: 'flex-end',
          flexWrap: { xs: 'wrap', md: 'nowrap' },
          justifyContent: { xs: 'center', md: 'flex-start' }
        }}
      >
        <ProfilePicture src={data.profileImg} alt='profile-picture' />
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            ml: { xs: 0, md: 6 },
            alignItems: 'flex-end',
            flexWrap: ['wrap', 'nowrap'],
            justifyContent: ['center', 'space-between']
          }}
        >
          <Box sx={{ mb: [6, 0], display: 'flex', flexDirection: 'column', alignItems: ['center', 'flex-start'] }}>
            <Typography variant='h5' sx={{ mb: 4, fontSize: '1.375rem' }}>
              {data.fullName}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: ['center', 'flex-start']
              }}
            >
              <Box sx={{ mr: 4, display: 'flex', alignItems: 'center', '& svg': { mr: 1, color: 'text.secondary' } }}>
                <Icon icon={designationIcon} />
                <Typography sx={{ color: 'text.secondary', fontWeight: 600 }}>{data.user.name}</Typography>
              </Box>
              <Box sx={{ mr: 4, display: 'flex', alignItems: 'center', '& svg': { mr: 1, color: 'text.secondary' } }}>
                <Icon icon='mdi:map-marker-outline' />
                <Typography sx={{ color: 'text.secondary', fontWeight: 600 }}>Athens Greece</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', '& svg': { mr: 1, color: 'text.secondary' } }}>
                <Icon icon='mdi:calendar-blank-outline' />
                <Typography sx={{ color: 'text.secondary', fontWeight: 600 }}>Joined 25 April</Typography>
              </Box>
            </Box>
          </Box>
          <Button variant='contained' startIcon={<Icon icon='mdi:settings' fontSize={20} />}>
            Profile Settings
          </Button>
        </Box>
      </CardContent>
    </Card>
  ) : null
}

export default UserProfileHeader