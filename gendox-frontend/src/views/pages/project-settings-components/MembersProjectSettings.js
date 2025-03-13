// ** React Imports
import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useSettings } from 'src/@core/hooks/useSettings'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import Icon from 'src/views/custom-components/mui/icon/icon'
import CustomChip from 'src/views/custom-components/mui/chip/index'
import SearchToolbar from 'src/utils/searchToolbar'
import InviteDialog from 'src/views/pages/project-settings-components/members-components/InviteDialog'

import DeleteConfirmDialog from 'src/utils/dialogs/DeleteConfirmDialog'
import { getErrorMessage } from 'src/utils/errorHandler'
import toast from 'react-hot-toast'
import { fetchProjectMembersAndRoles, deleteProjectMember } from 'src/store/activeProject/activeProject'
import {fetchOrganizationMembers} from 'src/store/activeOrganization/activeOrganization'

import { userTypeStatus, memberRoleStatus, escapeRegExp, renderClientAvatar } from 'src/utils/membersUtils'
import { localStorageConstants } from 'src/utils/generalConstants'

const MembersProjectSettings = () => {
  const dispatch = useDispatch()
  const { settings } = useSettings()
  const isDemo = settings.isDemo
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)
  const project = useSelector(state => state.activeProject.projectDetails)
  const projectMembers = useSelector(state => state.activeProject.projectMembersAndRoles)
  const isMembersLoading = useSelector(state => state.activeProject.isMembersLoading)
  const isDeletingMember = useSelector(state => state.activeProject.isDeletingMember)

  const { id: projectId, organizationId } = project
  const [searchText, setSearchText] = useState([])
  const [filteredProjectMembers, setFilteredProjectMembers] = useState([])
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10
  })
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)

  useEffect(() => {
    if (projectId) {
      dispatch(fetchProjectMembersAndRoles({ organizationId, projectId, token }));
    }
    if (organizationId) {
      dispatch(fetchOrganizationMembers({ organizationId, token }));
    }
  }, [projectId, organizationId, token, dispatch])

  useEffect(() => {
    setFilteredProjectMembers(projectMembers)
  }, [projectMembers])

  const handleSearch = searchValue => {
    setSearchText(searchValue)
    const searchRegex = new RegExp(escapeRegExp(searchValue), 'i')

    const filteredRows = projectMembers.filter(row => {
      return Object.keys(row).some(field => {
        const fieldValue = row[field]
        return fieldValue && searchRegex.test(fieldValue.toString())
      })
    })
    setFilteredProjectMembers(searchValue.length ? filteredRows : projectMembers)
  }

  const handleMenuClick = (event, row) => {
    setAnchorEl(event.currentTarget)
    setSelectedUser(row)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleDeleteUser = async () => {
    if (selectedUser) {
      dispatch(
        deleteProjectMember({
          organizationId,
          projectId,
          userId: selectedUser.id,
          token
        })
      )
        .unwrap()
        .then(() => {
          toast.success('User deleted successfully')
          dispatch(fetchProjectMembersAndRoles({ organizationId, projectId, token }))
        })
        .catch(error => {
          toast.error(`Failed to delete user. Error: ${getErrorMessage(error)}`)
        })
      setConfirmDelete(false)
      handleMenuClose()
    }
  }

  const handleBanUser = () => {
    // Implement the ban user logic here
    console.log('Banning user:', selectedUser)
    handleMenuClose()
  }

  const handleDeleteConfirmOpen = () => {
    handleMenuClose()
    setConfirmDelete(true)
  }

  const handleDeleteConfirmClose = () => {
    setConfirmDelete(false)
  }

  const handleInviteNewMembers = () => {
    setShowInviteDialog(true)
  }

  const columns = [
    {
      flex: 0.25,
      minWidth: 300,
      field: 'userName',
      headerName: 'NAME',
      renderCell: params => {
        const { row } = params

        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {renderClientAvatar(params)}
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontWeight: 600 }}>
                {row.name}
              </Typography>
              <Typography noWrap variant='caption'>
                {row.userName}
              </Typography>
            </Box>
          </Box>
        )
      }
    },
    {
      flex: 0.25,
      minWidth: 150,
      headerName: 'EMAIL',
      field: 'email',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.email}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 140,
      field: 'role',
      headerName: 'ORGANIZATION ROLE',
      sortable: false,
      renderCell: params => {
        if (isMembersLoading) {
          // Render a loader or placeholder
          return <Typography variant='body2'>Loading...</Typography>
        }
        const role = params.row.role?.name || 'UNKNOWN'
        const status = memberRoleStatus[role] || memberRoleStatus.UNKNOWN
        return (
          <Typography variant='body2' sx={{ display: 'flex', alignItems: 'center' }}>
            {status.icon && <Icon icon={status.icon} style={{ color: status.color, marginRight: '0.5rem' }} />}

            {status.title}
          </Typography>
        )
      }
    },

    {
      flex: 0.2,
      minWidth: 140,
      field: 'userType',
      headerName: 'USER TYPE',
      sortable: false,
      renderCell: params => {
        const userType = params.row.userType
        const status = userTypeStatus[userType] || userTypeStatus.UNKNOWN
        return (
          <CustomChip
            size='small'
            variant='outlined'
            color={status.color}
            label={status.title}
            sx={{ '& .MuiChip-label': { textTransform: 'capitalize' } }}
          />
        )
      }
    },

    {
      flex: 0.1,
      field: 'phone',
      minWidth: 80,
      headerName: 'PHONE',
      sortable: false,
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.phone}
        </Typography>
      )
    },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      renderCell: params => (
        <>
          <IconButton onClick={event => handleMenuClick(event, params.row)}>
            <Icon icon='mdi:dots-vertical' />
          </IconButton>
          <Menu
            id='actions-menu'
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center'
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'center'
            }}
          >
            <MenuItem onClick={handleDeleteConfirmOpen}>Remove User</MenuItem>
            {/* <MenuItem onClick={handleBanUser}>Ban User</MenuItem> */}
          </Menu>
        </>
      )
    }
  ]

  return (
    <Card>
      <CardHeader />
      <Box sx={{ position: 'relative' }}>
        <Box
          sx={{
            filter: isMembersLoading || isDeletingMember ? 'blur(3px)' : 'none',
            transition: 'filter 0.3s ease'
          }}
        >
          <DataGrid
            autoHeight
            columns={columns}
            disableRowSelectionOnClick
            disableColumnFilter
            disableColumnMenu
            pageSizeOptions={[10, 25, 50]}
            paginationModel={paginationModel}
            slots={{ toolbar: SearchToolbar }}
            onPaginationModelChange={setPaginationModel}
            rows={filteredProjectMembers.length ? filteredProjectMembers : projectMembers}
            slotProps={{
              baseButton: {
                variant: 'outlined'
              },
              toolbar: {
                value: searchText,
                clearSearch: () => handleSearch(''),
                onChange: event => handleSearch(event.target.value)
              }
            }}
          />
        </Box>
      </Box>

      <DeleteConfirmDialog
        open={confirmDelete}
        onClose={handleDeleteConfirmClose}
        onConfirm={handleDeleteUser}
        title='Confirm Deletion User'
        contentText={`Are you sure you want to delete ${
          selectedUser?.name || selectedUser?.userName || 'this user'
        } from the project? This action cannot be undone.`}
        confirmButtonText='Remove Member'
        cancelButtonText='Cancel'
      />

      {/* Invite New Members Button */}
      <Box sx={{ padding: 4, display: 'flex', justifyContent: 'flex-end', py: '1.5rem' }}>
        <Button
          size='large'
          variant='contained'
          onClick={handleInviteNewMembers}
          target='_blank'
          rel='noopener noreferrer'
        >
          Invite new members
        </Button>
      </Box>

      {/* Invite Dialog */}
      <InviteDialog open={showInviteDialog} handleClose={() => setShowInviteDialog(false)} />
    </Card>
  )
}

export default MembersProjectSettings
