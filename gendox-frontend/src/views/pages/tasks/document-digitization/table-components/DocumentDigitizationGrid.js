import React, { useMemo, useState } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { Box, IconButton, Tooltip, Menu, MenuItem } from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import CircularProgress from '@mui/material/CircularProgress'
import { answerFlagEnum } from 'src/utils/tasks/answerFlagEnum'
import Checkbox from '@mui/material/Checkbox'
import ReplayIcon from '@mui/icons-material/Replay'
import { useTheme } from '@mui/material/styles'
import EditIcon from '@mui/icons-material/Edit'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'

const DocumentDigitizationGrid = ({
  openDialog,
  documents,
  documentPages,
  onGenerate,
  isLoading,
  isBlurring,
  page,
  pageSize,
  setPage,
  setPageSize,
  totalDocuments,
  isSelectingDocuments = false,
  selectedDocuments = [],
  onSelectDocument = () => {},
  onGenerateSingleAnswer = () => {},
  isGeneratingAll
}) => {
  const theme = useTheme()

  const [generateMenuAnchor, setGenerateMenuAnchor] = useState(null)
  const [generateMenuDoc, setGenerateMenuDoc] = useState(null)


  const docMaxPages = 12

  const docPagesMap = useMemo(() => {
  const map = {}
  ;(documentPages.content || []).forEach(page => {
    map[page.taskDocumentNodeId] = page
  })
  return map
}, [documentPages])


  const maxPageOverall = useMemo(() => {
    return Math.max(0, ...Object.values(docMaxPages))
  }, [docMaxPages])

  const pageNumbers = useMemo(() => {
    return Array.from({ length: maxPageOverall }, (_, i) => i + 1)
  }, [maxPageOverall])

  function truncateText(text, maxLength = 60) {
    if (!text) return ''
    return text.length > maxLength ? text.slice(0, maxLength) + '…' : text
  }

  const sortedDocuments = useMemo(() => {
    return [...documents].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }, [documents])

  const columns = useMemo(
    () => [
      {
        field: 'name',
        headerName: 'Document',
        flex: 0.6,
        width: 280,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: params => <Box sx={{ fontWeight: 700 }}>{params.value}</Box>
      },
      {
        field: 'pages',
        headerName: 'Pages',
        width: 280,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: params => <Box>{params?.value? params.value === 1 ? '1 page' : `${params.value} pages` : 'not0 generated' }</Box>
      },
    ],
    [documents, selectedDocuments, onSelectDocument]
  )

  const rows = useMemo(() => {
    return sortedDocuments.map(doc => ({
      id: doc.id,
      name: doc.name || 'Unknown Document',
      pages: docMaxPages[doc.id] || 'not generated',
      _doc: doc // keep a reference for actions
    }))
  }, [pageNumbers, sortedDocuments])

  if (!sortedDocuments.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
        No documents to display. Please add some above.
      </Box>
    )
  }

  return (
    <Box
      sx={{
        position: 'relative',
        height: 650,
        width: '100%',
        overflowX: 'auto',
        filter: isLoading || isBlurring ? 'blur(6px)' : 'none',
        transition: 'filter 0.3s ease',
        borderRadius: 1
      }}
    >
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 1
          }}
        >
          <CircularProgress />
        </Box>
      )}

      <DataGrid
        rows={rows}
        columns={columns}
        pagination
        columnHeaderHeight={108}
        paginationMode='server'
        rowCount={totalDocuments}
        estimatedRowCount={totalDocuments}
        paginationModel={{ page, pageSize }}
        pageSizeOptions={[20]}
        onPaginationModelChange={({ page: newPage }) => {
          setPage(newPage)
        }}
        disableRowSelectionOnClick
        componentsProps={{
          pagination: { showFirstButton: true, showLastButton: true }
        }}
        loading={isLoading || isBlurring}
        sx={{
          '& .MuiDataGrid-cell': {
            outline: 'none',
            transition: 'background-color 0.15s ease',
            '&:focus-within': {
              backgroundColor: 'rgba(25,118,210,0.08)'
            },
            whiteSpace: 'normal',
            lineHeight: 1.4,
            py: 1
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            overflowWrap: 'break-word',
            whiteSpace: 'normal',
            lineHeight: 1.4,
            fontSize: '0.875rem'
          }
        }}
      />

      <Menu
        anchorEl={generateMenuAnchor}
        open={Boolean(generateMenuAnchor)}
        onClose={() => {
          setGenerateMenuAnchor(null)
          setGenerateMenuDoc(null)
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <MenuItem
          onClick={() => {
            setGenerateMenuAnchor(null)
            if (generateMenuDoc) onGenerate([generateMenuDoc]) // whole document
          }}
        >
          Generate Document
        </MenuItem>
        <MenuItem
          onClick={() => {
            setGenerateMenuAnchor(null)
            if (generateMenuDoc) {

              onGenerateSingleAnswer(generateMenuDoc)
            }
          }}
        >
          Generate Pages
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default DocumentDigitizationGrid
