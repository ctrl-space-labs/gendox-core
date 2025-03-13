import React, { useMemo, useState } from 'react'
import { Card, CardContent, Typography, Button, Box, Grid } from '@mui/material'
import Icon from 'src/views/custom-components/mui/icon/icon'
import { useAuth } from 'src/authentication/useAuth'
import { generateIdenticon } from 'src/utils/identiconUtil'
import toast from 'react-hot-toast'
import userService from 'src/gendox-sdk/userService'
import { getErrorMessage } from 'src/utils/errorHandler'
import CustomAvatar from 'src/views/custom-components/mui/avatar'
import Chip from 'src/views/custom-components/mui/chip'
import DeleteConfirmDialog from 'src/utils/dialogs/DeleteConfirmDialog'
import { useSettings } from 'src/@core/hooks/useSettings'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import Dialog from '@mui/material/Dialog'
import Divider from '@mui/material/Divider'
import { localStorageConstants } from 'src/utils/generalConstants'

function editUserDialog(openEdit, handleEditClose) {
  return (
    <Dialog
      open={openEdit}
      onClose={handleEditClose}
      aria-labelledby='user-view-edit'
      aria-describedby='user-view-edit-description'
    >
      <DialogTitle
        id='user-view-edit'
        sx={{
          textAlign: 'center',
          pt: [`3rem`]
        }}
      >
        Edit User Information
      </DialogTitle>
      <DialogContent
        sx={{
          pb: '3rem',
          px: '2rem'
        }}
      >
        <DialogContentText variant='body2' id='user-view-edit-description' sx={{ textAlign: 'center' }}>
          This feature is not available yet. We're working hard to get it up and running soon. Stay tuned!
        </DialogContentText>
      </DialogContent>
      <DialogActions
        sx={{
          justifyContent: 'center',
          pb: '3rem'
        }}
      >
        <Button variant='outlined' color='secondary' onClick={handleEditClose}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const ProfileCard = props => {
  const { userData } = props

  const { settings } = useSettings()
  const isDemo = settings.isDemo

  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)

  const { logout } = useAuth()

  let identiconSrc = useMemo(() => generateIdenticon(userData.id), [userData.email])

  const [openEdit, setOpenEdit] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)

  // Handle Edit dialog
  const handleEditClickOpen = () => setOpenEdit(true)
  const handleEditClose = () => setOpenEdit(false)

  // Handle Delete dialog
  const handleDeleteClickOpen = () => setOpenDeleteDialog(true)
  const handleDeleteClose = () => setOpenDeleteDialog(false)

  const handleLogout = () => {
    logout()
  }

  // Handle Delete User
  const handleDeleteUser = async () => {
    console.log('Attempting to delete user:', userData.id) // Debugging log
    if (!token) {
      toast.error('Authentication token missing.')
      return
    }

    try {
      // Call the API function and pass the user ID and stored token
      await userService.deactivateUserById(userData.id, token)
      toast.success('User deleted successfully.')
      setOpenDeleteDialog(false)

      handleLogout()
    } catch (error) {
      toast.error(`Failed to deactive user. Error: ${getErrorMessage(error)}`)
      console.error('Error deactivating user:', error) // Log the error for debugging
    } finally {
      handleDeleteClose() // Close the delete confirmation dialog
    }
  }

  return (
    <Card>
      <CardContent>
        {/* Avatar and Name */}
        <Box display='flex' flexDirection='column' alignItems='center' gap={1} sx={{ p: '2rem' }}>
          <CustomAvatar
            src={identiconSrc}
            variant='rounded'
            alt={userData.name}
            sx={{ width: 120, height: 120, fontWeight: 600, mb: 4 }}
          />
          <Typography variant='h6' sx={{ mb: '0.5rem' }}>
            {userData.name}
          </Typography>
          <Chip
            variant='outlined'
            size='small'
            label={userData.role}
            color={'error'}
            sx={{
              fontWeight: 600,
              borderRadius: '5px',
              fontSize: '0.875rem'
            }}
          />
        </Box>

        <Divider />
        {/* Stats */}
        <Grid container spacing={2} justifyContent='center'>
          <Grid item>
            <Box display='flex' alignItems='center'>
              {/*<Business sx={{ color: "#06D6A0", fontSize: 30 }} />*/}
              <CustomAvatar skin='light' variant='rounded' color={'primary'} sx={{ mr: 3 }}>
                <Icon icon='mdi:domain' />
              </CustomAvatar>
              <Box>
                <Typography fontWeight='bold' mt={1}>
                  {userData.organizations.length}
                </Typography>
                <Typography variant={'body2'}>Organizations</Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item>
            <Box display='flex' alignItems='center'>
              {/*<Business sx={{ color: "#06D6A0", fontSize: 30 }} />*/}
              <CustomAvatar skin='light' variant='rounded' color={'primary'} sx={{ mr: 3 }}>
                <Icon icon='mdi:briefcase-variant-outline' />
              </CustomAvatar>
              <Box>
                <Typography fontWeight='bold' mt={1}>
                  {userData.organizations.reduce((acc, organization) => acc + (organization.projects?.length || 0), 0)}
                </Typography>
                <Typography variant={'body2'}>Projects</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Details */}
        <Box mt={3} sx={{ py: '2rem' }}>
          <Typography variant='subtitle2' gutterBottom>
            Username: <strong>{userData.userName}</strong>
          </Typography>
          <Typography variant='subtitle2' gutterBottom>
            Email: <strong>{userData.email}</strong>
          </Typography>
          <Typography variant='subtitle2' gutterBottom>
            Role: <strong>{userData.role}</strong>
          </Typography>
        </Box>

        {/* Buttons */}
        <Box display='flex' justifyContent='center' mt={'1rem'} gap={'2rem'}>
          <Button disabled={isDemo} variant='contained' sx={{ mr: 2 }} onClick={handleEditClickOpen}>
            Edit
          </Button>
          <Button variant='outlined' color='error' onClick={handleDeleteClickOpen}>
            Delete
          </Button>

          {/* Edit User Dialog */}
          {editUserDialog(openEdit, handleEditClose)}

          {/* Delete Confirmation Dialog */}
          <DeleteConfirmDialog
            open={openDeleteDialog}
            onClose={handleDeleteClose}
            onConfirm={handleDeleteUser}
            title='Confirm User Deletion'
            contentText={`Are you sure you want to delete ${userData.name}? You will lose access to all organizations and documents. This action cannot be undone.`}
            confirmButtonText='Delete Account'
            cancelButtonText='Cancel'
          />
        </Box>
      </CardContent>
    </Card>
  )
}

export default ProfileCard
