import React, { useEffect, useState, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useSettings } from 'src/@core/hooks/useSettings'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import Icon from 'src/views/custom-components/mui/icon/icon'
import Chip from 'src/views/custom-components/mui/chip/index'
import SearchToolbar from 'src/utils/searchToolbar'
import { localStorageConstants } from 'src/utils/generalConstants'

import {
  updateMemberRole,
  removeOrganizationMember,
  fetchOrganizationMembers
} from 'src/store/activeOrganization/activeOrganization'
import DeleteConfirmDialog from 'src/utils/dialogs/DeleteConfirmDialog'
import { getErrorMessage } from 'src/utils/errorHandler'
import toast from 'react-hot-toast'

import { userTypeStatus, memberRoleStatus, escapeRegExp, renderClientAvatar } from 'src/utils/membersUtils'

const MembersOrganizationSettings = () => {
  const dispatch = useDispatch()
  const { settings } = useSettings()
  const isDemo = settings.isDemo
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)

  const organization = useSelector(state => state.activeOrganization.activeOrganization)
  const { id: organizationId } = organization
  const organizationMembers = useSelector(state => state.activeOrganization.organizationMembers)
  const isFetchingMembers = useSelector(state => state.activeOrganization.isFetchingMembers)
  const [searchText, setSearchText] = useState('');
  const [filteredOrganizationMembers, setFilteredOrganizationMembers] = useState([])
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10
  })

  const [roleAnchorEl, setRoleAnchorEl] = useState(null)
  const [actionAnchorEl, setActionAnchorEl] = useState(null)
  const [selectedUserForRole, setSelectedUserForRole] = useState(null)
  const [selectedUserForAction, setSelectedUserForAction] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)

  useEffect(() => {
    if (organizationId) {
      dispatch(fetchOrganizationMembers({ organizationId, token }))
    }
  }, [organizationId])

  useEffect(() => {
    if (!searchText) {
      setFilteredOrganizationMembers(organizationMembers);
    }
  }, [organizationMembers, searchText]);

  const handleSearch = searchValue => {
    setSearchText(searchValue)
    const searchRegex = new RegExp(escapeRegExp(searchValue), 'i')

    const filteredRows = organizationMembers.filter(row => {
      return (
        searchRegex.test(row.user.name || '') ||
        searchRegex.test(row.user.userName || '') ||
        searchRegex.test(row.user.email || '') ||
        (row.user.phone && searchRegex.test(row.user.phone)) ||
        searchRegex.test(row.role?.name || '') || // Filter by role
        searchRegex.test(row.user.userType.name || '') // Filter by user type
      )
    })

    setFilteredOrganizationMembers(searchValue.length ? filteredRows : organizationMembers)
  }

  const handleRoleMenuClick = (event, row) => {
    setRoleAnchorEl(event.currentTarget)
    setSelectedUserForRole(row)
  }

  const handleActionMenuClick = (event, row) => {
    setActionAnchorEl(event.currentTarget)
    setSelectedUserForAction(row)
  }

  const handleMenuClose = () => {
    setRoleAnchorEl(null)
    setActionAnchorEl(null)
  }

  const handleBanUser = () => {
    // Implement the ban user logic here
    console.log('Banning user:', selectedUserForAction)
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

  const toggleInviteDialog = () => {
    setShowInviteDialog(prev => !prev)
  }

  const handleChangeUserRole = async newRole => {
    if (selectedUserForRole) {
      // Update role in
      const data = {
        userOrganizationId: selectedUserForRole.id,
        roleName: newRole
      }

      dispatch(updateMemberRole({ organizationId, userId: selectedUserForRole.user.id, data, token }))
        .unwrap()
        .then(() => {
          toast.success('Role updated successfully')
        })
        .catch(error => {
          console.error('Failed to update user role:', error)
          toast.error(`Failed to update user role. Error: ${getErrorMessage(error)}`)
        })

      handleMenuClose()
    }
  }

  const handleDeleteUser = async () => {
    if (selectedUserForAction) {
      dispatch(removeOrganizationMember({ organizationId, userId: selectedUserForAction.user.id, token }))
        .unwrap()
        .then(() => {
          toast.success('User deleted successfully')
        })
        .catch(error => {
          console.error('Failed to delete user:', error)
          toast.error(`Failed to delete user. Error: ${getErrorMessage(error)}`)
        })
      setConfirmDelete(false)
      handleMenuClose()
    }
  }

  const columns = [
    {
      flex: 0.25,
      minWidth: 300,
      field: 'name',
      headerName: 'NAME',
      sortable: false,
      renderCell: params => {
        const { row } = params
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {renderClientAvatar(params)}
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontWeight: 600 }}>
                {row.user.name}
              </Typography>
              <Typography noWrap variant='caption'>
                {row.user?.userName || ''}
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
      sortable: false,
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.user.email}
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
        const role = params.row.role?.name || 'UNKNOWN'
        const status = memberRoleStatus[role] || memberRoleStatus.UNKNOWN
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant='body2' sx={{ display: 'flex', alignItems: 'center' }}>
              {status.icon && <Icon icon={status.icon} style={{ color: status.color, marginRight: '0.5rem' }} />}
              {status.title}
            </Typography>

            {status?.title !== 'ADMIN' && (
              <>
                <IconButton onClick={event => handleRoleMenuClick(event, params.row)}>
                  <Icon icon='mdi:menu-swap-outline' />
                </IconButton>
                <Menu
                  id='role-menu'
                  anchorEl={roleAnchorEl}
                  open={Boolean(roleAnchorEl) && selectedUserForRole?.id === params.row.id}
                  onClose={handleMenuClose}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                  {Object.keys(memberRoleStatus)
                    .filter(roleKey => roleKey !== role && roleKey !== 'UNKNOWN')
                    .map(roleKey => (
                      <MenuItem key={roleKey} onClick={() => handleChangeUserRole(roleKey)}>
                        <Icon
                          icon={memberRoleStatus[roleKey].icon}
                          style={{
                            marginRight: '0.5rem',
                            color: memberRoleStatus[roleKey].color
                          }}
                        />
                        {memberRoleStatus[roleKey].title}
                      </MenuItem>
                    ))}
                </Menu>
              </>
            )}
          </Box>
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
        const userType = params.row.user.userType.name
        const status = userTypeStatus[userType] || userTypeStatus.UNKNOWN
        return <Chip size='small' variant='outlined' color={status.color} label={status.title} />
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
          {params.row.user.phone}
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
          <IconButton onClick={event => handleActionMenuClick(event, params.row)}>
            <Icon icon='mdi:dots-vertical' />
          </IconButton>
          <Menu
            id='actions-menu'
            anchorEl={actionAnchorEl}
            open={Boolean(actionAnchorEl) && selectedUserForAction?.id === params.row.id}
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
    <Card
      sx={{
        pt: '1.5rem',
        pb: '1.5rem',
        filter: isFetchingMembers ? 'blur(3px)' : 'none',
        transition: 'filter 0.3s ease'
      }}
    >
      <DataGrid
        columns={columns}
        disableRowSelectionOnClick
        disableColumnFilter
        disableColumnMenu
        pageSizeOptions={[10, 25, 50]}
        paginationModel={paginationModel}
        slots={{ toolbar: SearchToolbar }}
        onPaginationModelChange={setPaginationModel}
        rows={filteredOrganizationMembers}
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

      <DeleteConfirmDialog
        open={confirmDelete}
        onClose={handleDeleteConfirmClose}
        onConfirm={handleDeleteUser}
        title='Confirm Deletion User'
        contentText={`Are you sure you want to delete ${
          selectedUserForAction?.name || selectedUserForAction?.userName || 'this user'
        }? This action cannot be undone.`}
        confirmButtonText='Remove Member'
        cancelButtonText='Cancel'
      />
    </Card>
  )
}

export default MembersOrganizationSettings
