// ** React Imports
import { useState, Fragment } from 'react'

import { useSelector, useDispatch } from 'react-redux'

// ** Next Import
import { useRouter } from 'next/router'

import { activeOrganizationActions } from 'src/store/apps/activeOrganization/activeOrganization'
import { activeProjectActions } from 'src/store/apps/activeProject/activeProject'

// ** MUI Imports
import Box from '@mui/material/Box'
import Menu from '@mui/material/Menu'
import Badge from '@mui/material/Badge'
import MenuItem from '@mui/material/MenuItem'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import AvatarGroup from '@mui/material/AvatarGroup'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import React from 'react'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import CustomAvatar from 'src/@core/components/mui/avatar'

// import AddHomeIcon from '@mui/icons-material/AddHome'

// ** Context
import { useAuth } from 'src/hooks/useAuth'
import { useGridRowSelection } from '@mui/x-data-grid/internals'

// ** Config
import authConfig from 'src/configs/auth'

// ** Styled Components
const BadgeContentSpan = styled('span')(({ theme }) => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: theme.palette.success.main,
  boxShadow: `0 0 0 2px ${theme.palette.background.paper}`
}))

const OrganizationsDropdown = props => {
  const dispatch = useDispatch()

  // Inside your component function
  const routerFromUrl = useRouter()
  const { query } = routerFromUrl

  // Extract selectedOrganizationId and selectedProjectId from query object
  const { organizationId, projectId } = query

  // ** Props
  const { settings } = props
  const userData = useAuth()

  // Find the organization that matches the organizationId from the URL
  const activeOrganization = userData.user.organizations.find(org => org.id === organizationId)

  // const [selectedOrganization, setSelectedOrganization] = useState(userData ? userData.user.organizations[0] : null)

  const [selectedOrganization, setSelectedOrganization] = useState(activeOrganization)

  // ** States
  const [anchorEl, setAnchorEl] = useState(null)

  // ** Hooks
  const router = useRouter()
  const { logout } = useAuth()

  const userAuth = useAuth()

  if (!activeOrganization) {
    // Redirect to a 404 page
    router.push('/404')

    return null
  }

  // ** Vars
  const { direction } = settings

  const handleDropdownOpen = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleDropdownClose = url => {
    if (url) {
      router.push(url)
    }
    setAnchorEl(null)
  }

  const styles = {
    py: 2,
    px: 4,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    color: 'text.primary',
    textDecoration: 'none',
    '& svg': {
      mr: 2,
      fontSize: '1.375rem',
      color: 'text.primary'
    }
  }

  const handleLogout = () => {
    logout()
    handleDropdownClose()
  }

  const handleProjects = organization => {
    dispatch(activeProjectActions.getActiveProject(organization))
    setSelectedOrganization(organization) // Update the selected organization
    handleDropdownClose() // Close the menu bar
    window.localStorage.setItem(authConfig.selectedOrganizationId, organization.id)

    // Determine the new project ID
    const newProjectId = organization.projects && organization.projects.length > 0 ? organization.projects[0].id : null

    // Update the project ID in local storage
    window.localStorage.setItem(authConfig.selectedProjectId, newProjectId)

    const newUrl = `/gendox/home?organizationId=${organization.id}&projectId=${newProjectId}`
    router.push(newUrl)
  }

  return (
    <Fragment>
      <Badge overlap='circular' sx={{ ml: 2, cursor: 'pointer' }} onClick={handleDropdownOpen}>
        <AvatarGroup max={2}>
          {userData.user.organizations.map(organization => (
            <Fragment key={organization.id}>
              <CustomAvatar
                onClick={() => {
                  handleProjects(selectedOrganization)
                  console.log('UserAuth', userAuth)
                }}
                sx={{
                  width: 40,
                  height: 40,

                  // backgroundColor: 'blue',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: 'white',
                  borderRadius: '50%',
                  fontSize: '16px'
                }}
              >
                {organization.name.substring(0, 4)}
              </CustomAvatar>
            </Fragment>
          ))}
        </AvatarGroup>
      </Badge>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => handleDropdownClose()}
        sx={{ '& .MuiMenu-paper': { width: 230, mt: 4 } }}
        anchorOrigin={{ vertical: 'bottom', horizontal: direction === 'ltr' ? 'right' : 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: direction === 'ltr' ? 'right' : 'left' }}
      >
        {userData.user.organizations.map(organization => (
          <MenuItem key={organization.id} sx={{ p: 0 }} onClick={() => handleProjects(organization)}>
            <Box sx={styles}>
              {/* <AddHomeIcon /> */}
              {organization.name}
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </Fragment>
  )
}

export default OrganizationsDropdown
