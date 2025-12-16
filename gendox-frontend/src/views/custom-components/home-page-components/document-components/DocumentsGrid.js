import React, { useState, useEffect } from 'react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { useDispatch, useSelector } from 'react-redux'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Divider from '@mui/material/Divider'
import Link from 'next/link'
import Icon from 'src/views/custom-components/mui/icon/icon'
import CustomAvatar from 'src/views/custom-components/mui/avatar'
import DeleteConfirmDialog from 'src/utils/dialogs/DeleteConfirmDialog'
import documentService from 'src/gendox-sdk/documentService.js'
import { fetchDocuments } from 'src/store/activeDocument/activeDocument'
import { localStorageConstants } from 'src/utils/generalConstants'
import toast from 'react-hot-toast'
import { getErrorMessage } from 'src/utils/errorHandler'
import TruncatedText from 'src/views/custom-components/truncated-text/TrancatedText'

const DocumentsGrid = ({ documents, showAll, setShowAll, page }) => {
  const dispatch = useDispatch()
  const { projectDetails, projectMembers } = useSelector(state => state.activeProject)
  const { id: projectId, organizationId } = projectDetails
  const token = localStorage.getItem(localStorageConstants.accessTokenKey)
  const [menuAnchorEl, setMenuAnchorEl] = useState(null)
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isBlurring, setIsBlurring] = useState(false)

  useEffect(() => {
    setShowAll(false)
  }, [projectDetails])

  const toggleShowAll = () => {
    setShowAll(prev => !prev)
  }

  const handleMenuOpen = (event, document) => {
    setMenuAnchorEl(event.currentTarget)
    setSelectedDocument(document)
  }

  const handleMenuClose = () => {
    setMenuAnchorEl(null)
  }

  const handleDeleteConfirmOpen = () => {
    handleMenuClose()
    setConfirmDelete(true)
  }

  const handleDeleteConfirmClose = () => {
    setConfirmDelete(false)
  }

  const handleDeleteDocument = async () => {
    setIsBlurring(true)
    setConfirmDelete(false)
    try {
      const response = await documentService.deleteDocument(organizationId, projectId, selectedDocument.id, token)
      toast.success('Document deleted successfully!')
      setSelectedDocument(null)
      setIsBlurring(false)
      dispatch(
        fetchDocuments({
          organizationId,
          projectId,
          token,
          page: page,
          target: 'projectDocuments'
        })
      )
    } catch (error) {
      console.error('Failed to delete document:', error)
      toast.error(`Document deletion failed. Error: ${getErrorMessage(error)}`)
      setSelectedDocument(null)
      setIsBlurring(false)
    }
  }

  const renderDocuments = () => {
    const visibleDocuments = showAll ? documents : documents.slice(0, 3)

    return visibleDocuments.map(document => {
      const documentAuthor = projectMembers.find(projMem => projMem?.user.id === document.createdBy)
      const relativeDate = formatDistanceToNow(parseISO(document.createAt), {
        addSuffix: true
      })

      return (
        <Grid item xs={12} sm={6} md={4} key={document.id}>
          <Box
            sx={{
              p: 5,
              boxShadow: 6,
              height: '100%',
              display: 'flex',
              borderRadius: 1,
              flexDirection: 'column',
              alignItems: 'flex-start',
              position: 'relative',
              backgroundColor: 'background.paper'
            }}
          >
            {/* Menu Icon Button */}
            <IconButton
              size='small'
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                color: 'text.primary'
              }}
              onClick={event => handleMenuOpen(event, document)}
            >
              <Icon icon='mdi:dots-vertical' />
            </IconButton>

            {/* Menu */}
            <Menu
              anchorEl={menuAnchorEl}
              open={Boolean(menuAnchorEl) && selectedDocument?.id === document.id}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              <MenuItem onClick={handleDeleteConfirmOpen}>Delete Document</MenuItem>
            </Menu>

            <Box sx={{ mb: 5, display: 'flex', alignItems: 'center' }}>
              <CustomAvatar skin='light' color='primary' variant='rounded' sx={{ mr: 3, height: 34, width: 34 }}>
                <Icon icon='mdi:file' />
              </CustomAvatar>
              <Typography
                variant='h6'
                component={Link}
                href={`/gendox/document-instance/?organizationId=${organizationId}&documentId=${document.id}&projectId=${projectId}`}
                sx={{
                  fontWeight: 600,
                  textDecoration: 'none',
                  '&:hover': { color: 'primary.main' },
                  cursor: 'pointer'
                }}
              >
                <TruncatedText text={document.title} />
              </Typography>
            </Box>
            <Box
              component='ul'
              sx={{
                mt: 0,
                mb: 5,
                pl: 6.75,
                '& li': { mb: 2, color: 'primary.main' }
              }}
            >
              <li>
                <Typography
                  // component={Link}
                  sx={{ color: 'inherit', textDecoration: 'none' }}
                  // href={`/gendox/document-instance/?organizationId=${organizationId}&documentId=${document.id}`}
                >
                  {documentAuthor ? documentAuthor.user.name : 'Unknown Author'}
                </Typography>
              </li>
              <li>
                <Typography
                  sx={{ color: 'inherit', textDecoration: 'none' }}
                  // component={Link}
                  // href={`/gendox/document-instance/?organizationId=${organizationId}&documentId=${document.id}`}
                >
                  {documentAuthor ? documentAuthor.user.email : 'Unknown E-mail'}
                </Typography>
              </li>
            </Box>

            <Typography
              // component={Link}
              // href={`/gendox/document-instance/?organizationId=${organizationId}&documentId=${document.id}`}
              sx={{
                mt: 'auto',
                textDecoration: 'none'
                // "&:hover": { color: "primary.main" },
              }}
            >
              {`Created ${relativeDate}`}
            </Typography>
          </Box>
        </Grid>
      )
    })
  }

  return (
    <>
      <Grid
        container
        spacing={6}
        sx={{
          filter: isBlurring ? 'blur(6px)' : 'none',
          transition: 'filter 0.3s ease'
        }}
      >
        {renderDocuments()}
        {documents.length > 3 && (
          <Grid item xs={12} style={{ textAlign: 'center' }}>
            <Divider
              sx={{
                my: theme => {
                  theme.spacing(3)
                }
              }}
            />
            <Tooltip title={showAll ? 'Show Less' : 'Show More'}>
              <IconButton onClick={toggleShowAll} sx={{ color: 'primary.main' }}>
                <Icon icon={showAll ? 'mdi:chevron-up' : 'mdi:chevron-down'} />
              </IconButton>
            </Tooltip>
          </Grid>
        )}
      </Grid>
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={confirmDelete}
        onClose={handleDeleteConfirmClose}
        onConfirm={handleDeleteDocument}
        title='Confirm Deletion'
        contentText={
          selectedDocument
            ? `Are you sure you want to delete "${selectedDocument.title}"? This action cannot be undone.`
            : 'Are you sure you want to delete this document? This action cannot be undone.'
        }
        confirmButtonText='Delete'
        cancelButtonText='Cancel'
      />
    </>
  )
}

export default DocumentsGrid
