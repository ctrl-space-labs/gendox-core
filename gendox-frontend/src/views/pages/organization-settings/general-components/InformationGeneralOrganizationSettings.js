import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import { localStorageConstants } from 'src/utils/generalConstants'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import toast from 'react-hot-toast'
import Icon from 'src/views/custom-components/mui/icon/icon'
import organizationService from 'src/gendox-sdk/organizationService'
import DeleteConfirmDialog from 'src/utils/dialogs/DeleteConfirmDialog'
import { getErrorMessage } from 'src/utils/errorHandler'
import { useAuth } from 'src/authentication/useAuth'
import commonConfig from 'src/configs/common.config.js'

const InformationGeneralOrganizationSettings = () => {
  const auth = useAuth()
  const router = useRouter()
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)
  const { provenAiEnabled, provenAiUrl } = commonConfig
  const organization = useSelector(state => state.activeOrganization.activeOrganization)
  const isBlurring = useSelector(state => state.activeOrganization.isBlurring)
  const [name, setName] = useState(organization.name || '')
  const [displayName, setDisplayName] = useState(organization.displayName || '')
  const [address, setAddress] = useState(organization.address || '')
  const [phone, setPhone] = useState(organization.phone || '')
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)

  useEffect(() => {
    setName(organization.name || '')
    setDisplayName(organization.displayName || '')
    setAddress(organization.address || '')
    setPhone(organization.phone || '')
  }, [organization])

  // Handlers for form inputs
  const handleNameChange = event => setName(event.target.value)
  const handleDisplayNameChange = event => setDisplayName(event.target.value)
  const handleAddressChange = event => setAddress(event.target.value)
  const handlePhoneChange = event => setPhone(event.target.value)

  // Handle Delete dialog
  const handleDeleteClickOpen = () => setOpenDeleteDialog(true)
  const handleDeleteClose = () => setOpenDeleteDialog(false)

  // Submit PUT request
  const handleSubmit = async e => {
    e.preventDefault() // Prevent default form submission

    // Construct the updated organization payload
    const updatedOrganizationPayload = {
      id: organization.id,
      name,
      displayName,
      address,
      phone
    }

    try {
      const response = await organizationService.updateOrganization(organization.id, updatedOrganizationPayload, token)
      toast.success('Organization updated successfully!')
      const path = `/gendox/organization-settings/?organizationId=${response.data.id}`
      router.reload(path)
    } catch (error) {
      console.error('Failed to update organization', error)
      toast.error(`Organization update failed. Error: ${getErrorMessage(error)}`)
    }
  }

  // Handler for deleting organization
  const handleDeleteOrganization = async () => {
    handleDeleteClose(false)
    try {
      await organizationService.deactivateOrganizationById(organization.id, token)
      toast.success('Organization deleted successfully!')
      const updatedOrganization = auth.user.organizations
      const firstActiveOrganization = updatedOrganization[0]

      if (firstActiveOrganization) {
        window.location.href = '/gendox/home'
      } else {
        window.location.href = '/gendox/create-organization'
      }
    } catch (error) {
      toast.error(`Organization deletion failed. Error: ${getErrorMessage(error)}`)
      // Redirect to the home page in case of an error
      router.push('/gendox/home')
    }
  }

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2
        }}
      >
        <CardHeader title='Information' />
      </Box>
      <form onSubmit={handleSubmit}>
        <CardContent
          sx={{
            filter: isBlurring ? 'blur(6px)' : 'none',
            transition: 'filter 0.3s ease'
          }}
        >
          <Grid container spacing={5}>
            <Grid item xs={12} sm={12} md={6}>
              <TextField
                fullWidth
                id='organization-name'
                label='Name'
                value={name}
                onChange={handleNameChange}
                InputLabelProps={{
                  shrink: true
                }}
              />
            </Grid>

            <Grid item xs={12} sm={12} md={6}>
              <TextField
                fullWidth
                id='organization-displayName'
                label='Display Name'
                value={displayName}
                onChange={handleDisplayNameChange}
                InputLabelProps={{
                  shrink: true
                }}
              />
            </Grid>

            <Grid item xs={12} sm={12} md={6}>
              <TextField
                fullWidth
                id='organization-address'
                label='Address'
                value={address}
                onChange={handleAddressChange}
                InputLabelProps={{
                  shrink: true
                }}
              />
            </Grid>

            <Grid item xs={12} sm={12} md={6}>
              <TextField
                fullWidth
                id='organization-phone'
                label='Phone'
                value={phone}
                onChange={handlePhoneChange}
                InputLabelProps={{
                  shrink: true
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={6}></Grid>

            {provenAiEnabled && (
              <Grid
                item
                xs={12}
                sm={6}
                md={6}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'flex-end'
                }}
              >
                <Button
                  size='large'
                  variant='outlined'
                  href={`${provenAiUrl}/provenAI/home/?organizationId=${organization.id}`}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <Box component='span' sx={{ mr: 5 }}>
                    Go to Proven-Ai
                  </Box>
                  <Icon icon='mdi:arrow-right-thin' />{' '}
                </Button>
              </Grid>
            )}
          </Grid>
        </CardContent>

        {/* <Divider sx={{ m: "0 !important" }} /> */}
        <CardActions
          sx={{
            justifyContent: 'flex-end',
            p: 2,
            filter: isBlurring ? 'blur(6px)' : 'none',
            transition: 'filter 0.3s ease'
          }}
        >
          <Button size='large' variant='outlined' color='error' onClick={handleDeleteClickOpen} sx={{ px: 5, py: 1 }}>
            Delete
          </Button>

          <Button size='large' type='submit' variant='contained' sx={{ px: 5, py: 1 }}>
            Save Changes
          </Button>
        </CardActions>
      </form>

      <DeleteConfirmDialog
        open={openDeleteDialog}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteOrganization}
        title='Delete'
        contentText={`Are you sure you want to delete ${organization.name}? All member users will be removed, and you will lose access to all related documents. This action cannot be undone.`}
        confirmButtonText='Delete'
        cancelButtonText='Cancel'
      />
    </>
  )
}

export default InformationGeneralOrganizationSettings
