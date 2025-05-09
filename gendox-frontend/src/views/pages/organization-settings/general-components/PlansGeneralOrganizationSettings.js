// ** React Imports
import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useTheme } from '@mui/material/styles'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'

const PlansOrganizationSettings = () => {
  const theme = useTheme()

  const organizationPlan = useSelector(state => state.activeOrganization.organizationPlans)
  const isBlurring = useSelector(state => state.activeOrganization.isBlurring)

  const manageSubscription = () => window.open('https://gendox.dev/my-account', '_blank')
  return (
    <>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          pr: 5
        }}
      >
        <CardHeader title='Subscription Plan Details' />

        {organizationPlan && (
          <Tooltip title='Access your subscription settings' arrow>
            <Grid
              item
              xs={12}
              sx={{
                filter: isBlurring ? 'blur(6px)' : 'none',
                transition: 'filter 0.3s ease'
              }}
            >
              <Button
                variant='outlined'
                color='primary'
                onClick={manageSubscription}
                disabled={false} // Example condition
                sx={{
                  padding: '12px 24px',
                  fontSize: '1.1rem'
                }}
              >
                Manage Subscription
              </Button>
            </Grid>
          </Tooltip>
        )}
      </Box>

      <CardContent
        sx={{
          filter: isBlurring ? 'blur(6px)' : 'none',
          transition: 'filter 0.3s ease'
        }}
      >
        {organizationPlan ? (
          <Grid container spacing={5}>
            {organizationPlan?.status === 'CANCELLED' && (
              <Grid
                item
                xs={12}
                sx={{
                  p: 2,
                  color: theme.palette.warning.main,
                  borderRadius: 1,
                  mb: 2
                }}
              >
                <Typography variant='body1' color='warning.main'>
                  Your subscription has been cancelled. Please renew your subscription to continue using the service
                  without interruption.
                </Typography>
              </Grid>
            )}
            {/* Plan Info Section */}
            <Grid item xs={12}>
              <Typography variant='h6' sx={{ mb: 2, color: theme.palette.primary.main }}>
                Plan Information
              </Typography>
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <TextField
                fullWidth
                id='organization-subscription-plan-name'
                label='Subscription Plan Name'
                value={organizationPlan?.subscriptionPlan?.name || ''}
                InputProps={{
                  readOnly: true
                }}
              />
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <TextField
                fullWidth
                id='organization-subscription-plan-description'
                label='Subscription Plan Description'
                value={organizationPlan?.subscriptionPlan?.description || ''}
                InputProps={{
                  readOnly: true
                }}
              />
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <TextField
                fullWidth
                id='organization-subscription-plan-price'
                label='Subscription Plan Price'
                value={
                  organizationPlan?.subscriptionPlan?.price
                    ? `${organizationPlan.subscriptionPlan.price} ${organizationPlan.subscriptionPlan.currency}`
                    : ''
                }
                InputProps={{
                  readOnly: true
                }}
              />
            </Grid>

            {/* Date Section */}
            <Grid item xs={12}>
              <Typography variant='h6' sx={{ mb: 2, color: theme.palette.primary.main }}>
                Subscription Dates
              </Typography>
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <TextField
                fullWidth
                id='organization-start-date'
                label='Start Date'
                value={new Date(organizationPlan?.startDate).toLocaleDateString() || ''}
                InputProps={{
                  readOnly: true
                }}
              />
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <TextField
                fullWidth
                id='organization-end-date'
                label='End Date'
                value={new Date(organizationPlan?.endDate).toLocaleDateString() || ''}
                InputProps={{
                  readOnly: true
                }}
              />
            </Grid>

            {/* Rate Limits Section */}
            <Grid item xs={12}>
              <Typography variant='h6' sx={{ mb: 2, color: theme.palette.primary.main }}>
                API Rate Limits
              </Typography>
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <TextField
                fullWidth
                id='organization-rate-limit'
                label='Rate Limit (Completions per Minute)'
                value={organizationPlan?.apiRateLimit?.completionsPerMinute || ''}
                InputProps={{
                  readOnly: true
                }}
              />
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <TextField
                fullWidth
                id='organization-rate-limit-public'
                label='Public Rate Limit (Completions per Minute)'
                value={organizationPlan?.apiRateLimit?.publicCompletionsPerMinute || ''}
                InputProps={{
                  readOnly: true
                }}
              />
            </Grid>

            {/* Additional Info Section */}
            <Grid item xs={12}>
              <Typography variant='h6' sx={{ mb: 2, color: theme.palette.primary.main }}>
                Additional Information
              </Typography>
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <TextField
                fullWidth
                id='organization-number-of-seats'
                label='Number of Seats'
                value={organizationPlan?.numberOfSeats || ''}
                InputProps={{
                  readOnly: true
                }}
              />
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <TextField
                fullWidth
                id='organization-messages-limit'
                label='User Message Monthly Limit'
                value={organizationPlan?.subscriptionPlan?.userMessageMonthlyLimitCount || ''}
                InputProps={{
                  readOnly: true
                }}
              />
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <TextField
                fullWidth
                id='organization-upload-limit'
                label='User Upload Limit (MB)'
                value={organizationPlan?.subscriptionPlan?.userUploadLimitMb || ''}
                InputProps={{
                  readOnly: true
                }}
              />
            </Grid>
          </Grid>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '200px',
              textAlign: 'center'
            }}
          >
            <Typography variant='h6' sx={{ mb: 2, color: theme.palette.text.secondary }}>
              No active subscription plan found.
            </Typography>
            <Button
              variant='outlined'
              color='primary'
              onClick={manageSubscription}
              sx={{
                padding: '12px 24px',
                fontSize: '1.1rem'
              }}
            >
              Manage Subscription
            </Button>
          </Box>
        )}
      </CardContent>
    </>
  )
}

export default PlansOrganizationSettings
