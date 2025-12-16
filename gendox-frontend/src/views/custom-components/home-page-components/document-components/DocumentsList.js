import React, { useState, useEffect } from 'react'
import { isValid, parseISO, format } from 'date-fns'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Icon from 'src/views/custom-components/mui/icon/icon'
import DeleteConfirmDialog from 'src/utils/dialogs/DeleteConfirmDialog'
import documentService from 'src/gendox-sdk/documentService.js'
import SearchToolbar from 'src/utils/searchToolbar'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/router'
import { fetchDocuments } from 'src/store/activeDocument/activeDocument'
import { getErrorMessage } from 'src/utils/errorHandler'
import toast from 'react-hot-toast'
import { localStorageConstants } from 'src/utils/generalConstants'
import TruncatedText from 'src/views/custom-components/truncated-text/TrancatedText'

const DocumentsList = ({ documents, page }) => {
  const dispatch = useDispatch()
  const { projectDetails, projectMembers } = useSelector(state => state.activeProject)
  const router = useRouter()
  const token = localStorage.getItem(localStorageConstants.accessTokenKey)
  const { id: projectId, organizationId } = projectDetails

  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isBlurring, setIsBlurring] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [filteredDocuments, setFilteredDocuments] = useState(documents)
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 20
  })

  useEffect(() => {
    setFilteredDocuments(documents || [])
  }, [documents])

  const handleMenuClick = (event, document) => {
    setAnchorEl(event.currentTarget)
    setSelectedDocument(document)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleDeleteConfirmOpen = () => {
    handleMenuClose()
    setConfirmDelete(true)
  }

  const handleDeleteConfirmClose = () => {
    setConfirmDelete(false)
  }

  const handleSearch = searchValue => {
    setSearchText(searchValue)

    const filteredRows = documents.filter(row => {
      return Object.keys(row).some(field => {
        const fieldValue = row[field]
        return fieldValue && fieldValue.toString().toLowerCase().includes(searchValue.toLowerCase())
      })
    })

    setFilteredDocuments(searchValue.length ? filteredRows : documents)
  }

  const handleDeleteDocument = async () => {
    if (selectedDocument) {
      setIsBlurring(true)
      setConfirmDelete(false)
      try {
        const response = await documentService.deleteDocument(organizationId, projectId, selectedDocument.id, token)
        toast.success('The document has been successfully deleted.')
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
  }

  const handleRowClick = params => {
    const { id } = params.row
    router.push(`/gendox/document-instance/?organizationId=${organizationId}&documentId=${id}&projectId=${projectId}`)
  }

  const columns = [
    {
      field: 'title',
      headerName: 'Title',
      flex: 0.3,
      minWidth: 200,
      sortable: true,
      renderCell: params => (
        <Typography variant='body2' sx={{ fontWeight: 600 }}>
          <TruncatedText text={params.row.title} />
        </Typography>
      )
    },
    {
      field: 'author',
      headerName: 'Author',
      flex: 0.2,
      minWidth: 150,
      sortable: true,
      valueGetter: params => {
        const documentAuthor = projectMembers.find(member => member.user.id === params?.row.createdBy)
        return documentAuthor?.user?.name || 'Unknown Author'
      },
      sortComparator: (v1, v2) => v1.localeCompare(v2),
      renderCell: params => <Typography variant='body2'>{params.value}</Typography>
    },
    {
      field: 'authorEmail',
      headerName: 'Author Email',
      flex: 0.2,
      minWidth: 200,
      valueGetter: params => {
        const documentAuthor = projectMembers.find(member => member.user.id === params?.row.createdBy)
        return documentAuthor?.user?.email || 'Unknown Email'
      },
      renderCell: params => <Typography variant='body2'>{params.value}</Typography>
    },
    {
      field: 'createdAt',
      headerName: 'Created At',
      flex: 0.2,
      minWidth: 150,
      sortable: true,
      sortComparator: (v1, v2) => new Date(v1) - new Date(v2),
      renderCell: params => {
        const createdAt = params.row.createAt
        const formattedDate =
          createdAt && isValid(parseISO(createdAt)) ? format(parseISO(createdAt), 'dd/MM/yyyy - HH:mm') : 'Unknown Date'

        return <Typography variant='body2'>{formattedDate}</Typography>
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      renderCell: params => (
        <>
          <IconButton
            onClick={event => {
              event.stopPropagation() // Prevent row click event
              handleMenuClick(event, params.row) // Open menu
            }}
          >
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
            <MenuItem onClick={handleDeleteConfirmOpen}>Delete Document</MenuItem>
          </Menu>
        </>
      )
    }
  ]

  return (
    <Card
      sx={{
        filter: isBlurring ? 'blur(6px)' : 'none',
        transition: 'filter 0.3s ease'
      }}
    >
      <CardHeader />
      <DataGrid
        rows={filteredDocuments}
        columns={columns}
        pageSizeOptions={[10, 25, 50]}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        disableRowSelectionOnClick
        onRowClick={handleRowClick}
        slots={{ toolbar: SearchToolbar }}
        slotProps={{
          toolbar: {
            value: searchText,
            clearSearch: () => handleSearch(''),
            onChange: event => handleSearch(event.target.value)
          }
        }}
        sx={{
          '& .MuiDataGrid-row': {
            cursor: 'pointer' // Make rows have a pointer cursor
          }
        }}
      />

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
    </Card>
  )
}

export default DocumentsList
