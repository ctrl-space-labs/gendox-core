import { useState, forwardRef } from 'react'
import { useSelector } from 'react-redux'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Dialog from '@mui/material/Dialog'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import DialogContent from '@mui/material/DialogContent'
import IconButton from '@mui/material/IconButton'
import Autocomplete from '@mui/material/Autocomplete'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import Icon from 'src/views/custom-components/mui/icon/icon'
import CustomAvatar from 'src/views/custom-components/mui/avatar'
import invitationService from 'src/gendox-sdk/invitationService'
import toast from 'react-hot-toast'
import { useAuth } from 'src/authentication/useAuth'
import { localStorageConstants } from 'src/utils/generalConstants'
import CardContent from '@mui/material/CardContent'
import Card from '@mui/material/Card'
import { getErrorMessage } from 'src/utils/errorHandler'
import { getAllowedRoles, memberRoleStatus } from 'src/utils/membersUtils'

const InviteDialog = ({ open, handleClose }) => {
  const auth = useAuth()
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)
  const project = useSelector(state => state.activeProject.projectDetails)
  const organizationMembers = useSelector(state => state.activeOrganization.organizationMembers)
  const { id: projectId, organizationId } = project
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [selectedRole, setSelectedRole] = useState('')

  const members = organizationMembers.filter(member => member.user.email !== null)
  const userRole = members.find(member => member.user.email === auth.user.email)?.role?.name
  const allowedRoles = getAllowedRoles(userRole)

  const validateEmail = email => {
    // Simple email validation regex
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const handleInvitation = async () => {
    if (!email) {
      setError('Email is required.')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.')
      return
    }

    setError('') // Clear any existing error

    const existingMember = members.find(member => member.user.email === email)
    const invitationBody = {
      inviteeEmail: email,
      projectId,
      organizationId,
      userRoleType: existingMember ? { name: existingMember.role.name } : { name: selectedRole },
      inviterUserId: auth.user.id
    }

    try {
      await invitationService.inviteProjectMember(organizationId, token, invitationBody)
      console.log('Invitation Sent')
      toast.success('Invitation sent successfully!')
      handleClose() // Close the dialog on success
    } catch (error) {
      handleClose()
      toast.error(`Error sending invitation Error: ${getErrorMessage(error)}`)
    }
  }

  const steps = [
    {
      title: 'Send Invitation 👍',
      description: 'Send an invitation to your friend',
      icon: 'mdi:email-send-outline' // ✉️
    },
    {
      title: 'Registration 😎',
      description: 'They can sign up and gain access to the project environment',
      icon: 'mdi:account-plus-outline' // 👤➕
    },
    {
      title: 'Start Using 🎉',
      description: 'Once registered, they can explore and utilize all available features!',
      icon: 'mdi:check-decagram' // ✅
    }
  ]

  const isEmailExisting = members.some(member => member.user.email === email)

  const handleEmailChange = (event, value) => {
    setEmail(value)
    if (error) setError('') // Clears error when user starts typing
  }

  return (
    <Dialog
      fullWidth
      open={open}
      onClose={handleClose}
      PaperProps={{
        style: {
          maxHeight: '95vh', // Adjust the max height as needed
          maxWidth: '60vw', // Adjust the max width as needed
          overflowY: 'auto' // Enable vertical scrolling
        }
      }}
    >
      <DialogContent
        sx={{
          position: 'relative',
          px: theme => ['1rem', '2rem'],
          pt: theme => ['2rem', '4rem']
        }}
      >
        <IconButton size='small' onClick={handleClose} sx={{ position: 'absolute', right: '1rem', top: '1rem' }}>
          <Icon icon='mdi:close' />
        </IconButton>
        <Box sx={{ mb: [1, 10], textAlign: 'center' }}>
          <Typography variant='h5' sx={{ mb: 1, lineHeight: '2rem' }}>
            Invite new Members
          </Typography>
          <Typography variant='body2'>{project.name} project</Typography>
        </Box>
        <Box>
          <Grid container spacing={4} justifyContent='center'>
            {steps.map((step, index) => (
              <Grid item xs={12} sm={4} key={index}>
                <Card
                  sx={{
                    backgroundColor: 'transparent',
                    display: 'flex',
                    flexDirection: { xs: 'row', sm: 'column' }, // Row on mobile, column on larger screens
                    alignItems: 'center',
                    textAlign: { xs: 'left', sm: 'center' }, // Left align text on mobile
                    justifyContent: 'center',
                    boxShadow: 'none',
                    gap: { xs: 2, sm: 0 } // Adds spacing between icon & text on mobile
                  }}
                >
                  <CustomAvatar
                    skin='light'
                    color='primary'
                    sx={{
                      width: [70, 100],
                      height: [70, 100],
                      '& svg': { fontSize: ['2.2rem', '2.5rem'] }
                    }}
                  >
                    <Icon icon={step.icon} />
                  </CustomAvatar>
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant='h6'>{step.title}</Typography>
                    <Typography variant='body2'>{step.description}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </DialogContent>
      <Divider sx={{ my: '0' }} />
      <DialogContent
        sx={{
          position: 'relative',
          px: ['1rem', '2rem'],
          pb: ['0rem', '2rem']
        }}
      >
        <Box sx={{ mb: ['1rem', '2rem'] }}>
          {/* Title */}
          <Typography variant='h6' sx={{ mb: 4, lineHeight: '2rem' }}>
            Invite New Member
          </Typography>

          {/* Input Fields */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
              gap: { xs: 2, sm: 0 }
            }}
          >
            {/* Autocomplete Email Input */}
            <Autocomplete
              freeSolo
              fullWidth
              options={members.map(member => member.user.email)}
              onInputChange={handleEmailChange}
              onChange={(event, value) => setEmail(value || '')}
              renderInput={params => (
                <TextField
                  {...params}
                  fullWidth
                  size='small'
                  id='refer-email'
                  placeholder='name@email.com'
                  value={email}
                  error={!!error}
                  helperText={error}
                  sx={{ mr: { xs: 0, sm: 4 } }}
                />
              )}
            />

            {/* Role Selection */}
            <Tooltip
              title={
                isEmailExisting
                  ? "User is already member of the Organization. Go to Organization Settings to update user's role."
                  : ''
              }
            >
              <Select
                value={isEmailExisting ? '' : selectedRole}
                onChange={e => setSelectedRole(e.target.value)}
                size='small'
                disabled={isEmailExisting}
                displayEmpty
                sx={{ ml: { xs: 0, sm: 2 }, width: { xs: '100%', sm: 'auto' } }}
              >
                {allowedRoles.map(role => (
                  <MenuItem key={role} value={role}>
                    {memberRoleStatus[role] ? memberRoleStatus[role].title : role}
                  </MenuItem>
                ))}
              </Select>
            </Tooltip>

            {/* Send Button */}
            <Button
              variant='contained'
              onClick={handleInvitation}
              sx={{ ml: { xs: 0, sm: 5 }, width: { xs: '100%', sm: 'auto' } }}
            >
              Send
            </Button>
          </Box>

          {/* Invitation Description */}
          <Typography variant='body2' sx={{ mt: 4 }}>
            {`Enter your friend’s email address and invite them to join the ${project.name} project!`}
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default InviteDialog
