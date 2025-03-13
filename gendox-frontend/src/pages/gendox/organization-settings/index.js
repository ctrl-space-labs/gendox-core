import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/router'
import { useSelector, useDispatch } from 'react-redux'
import { useAuth } from 'src/authentication/useAuth'
import { localStorageConstants } from 'src/utils/generalConstants'
import Card from '@mui/material/Card'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { ResponsiveCardContent } from 'src/utils/responsiveCardContent'
import {
  fetchOrganization,
  fetchAiModelProviders,
  fetchOrganizationAiModelKeys,
  fetchOrganizationPlans,
  fetchApiKeys,
  fetchOrganizationWebSites
} from 'src/store/activeOrganization/activeOrganization'
import OrganizationSettingsCard from 'src/views/pages/organization-settings/OrganizationSettingsCard'

const OrganizationSettings = () => {
  const auth = useAuth()
  const dispatch = useDispatch()
  const router = useRouter()
  const { organizationId } = router.query
  const [isBlurring, setIsBlurring] = useState(false)

  const organization = useSelector(state => state.activeOrganization.activeOrganization)

  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)

  useEffect(() => {
    if (organizationId) {
      dispatch(fetchAiModelProviders({ organizationId, token }))
      dispatch(fetchOrganization({ organizationId, token }))
      dispatch(fetchOrganizationAiModelKeys({ organizationId, token }))
      dispatch(fetchOrganizationPlans({ organizationId, token }))
      dispatch(fetchApiKeys({ organizationId, token }))
      dispatch(fetchOrganizationWebSites({ organizationId, token }))
    }
    // }
  }, [organizationId, router, dispatch])

  return (
    <Card
      sx={{
        backgroundColor: 'transparent',
        boxShadow: 'none',
        filter: isBlurring ? 'blur(6px)' : 'none',
        transition: 'filter 0.3s ease'
      }}
    >
      <ResponsiveCardContent sx={{ backgroundColor: 'background.paper' }}>
        <Box sx={{ textAlign: 'left' }}>
          <Typography variant='h4' sx={{ fontWeight: 600, color: 'text.secondary', mb: 2 }}>
            Organization Settings
          </Typography>
          <Typography variant='h6' sx={{ fontWeight: 400, color: 'primary.main' }}>
            {organization?.name || 'No Selected'}
          </Typography>
        </Box>
      </ResponsiveCardContent>
      <Box sx={{ height: 20 }} />
      <OrganizationSettingsCard />
    </Card>
  )
}

export default OrganizationSettings
