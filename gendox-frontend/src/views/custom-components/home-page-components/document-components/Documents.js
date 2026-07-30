import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import { useAuth } from 'src/authentication/useAuth'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import CardContent from '@mui/material/CardContent'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import Icon from 'src/views/custom-components/mui/icon/icon'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { ResponsiveCardContent } from 'src/utils/responsiveCardContent'
import DocumentsGrid from './DocumentsGrid'
import DocumentsList from './DocumentsList'
import { localStorageConstants } from 'src/utils/generalConstants'
import { fetchProjectDocuments } from 'src/store/activeDocument/activeDocument'
import { isValidOrganizationAndProject } from 'src/utils/validators'

const DEFAULT_PAGE_SIZE = 20
const DEFAULT_SORT = 'createdAt,desc'
const SORTABLE_FIELDS = new Set(['title', 'createdAt'])

const sortModelToParam = sortModel => {
  const active = sortModel?.[0]
  if (!active?.field || !active?.sort || !SORTABLE_FIELDS.has(active.field)) {
    return DEFAULT_SORT
  }
  return `${active.field},${active.sort}`
}

const sortParamToModel = (sortParam = DEFAULT_SORT) => {
  const [field, sort] = sortParam.split(',')
  if (!SORTABLE_FIELDS.has(field) || (sort !== 'asc' && sort !== 'desc')) {
    return [{ field: 'createdAt', sort: 'desc' }]
  }
  return [{ field, sort }]
}

const Documents = () => {
  const { user } = useAuth()

  const router = useRouter()
  const dispatch = useDispatch()

  const { organizationId, projectId } = router.query
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)
  const { projectDocuments, isBlurring } = useSelector(state => state.activeDocument)
  const { content: documents, totalPages, totalElements = 0 } = projectDocuments

  const [viewMode, setViewMode] = useState('grid')
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [showAll, setShowAll] = useState(false)
  const [documentNameContains, setDocumentNameContains] = useState('')
  const [sort, setSort] = useState(DEFAULT_SORT)
  // Keep list mounted after first open so switching views doesn't remount DataGrid
  const [listMounted, setListMounted] = useState(false)

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const sortModel = sortParamToModel(sort)

  useEffect(() => {
    setCurrentPage(0)
    setPageSize(DEFAULT_PAGE_SIZE)
    setDocumentNameContains('')
    setSort(DEFAULT_SORT)
    setListMounted(false)
    setViewMode('grid')
  }, [projectId])

  useEffect(() => {
    if (isValidOrganizationAndProject(organizationId, projectId, user)) {
      dispatch(
        fetchProjectDocuments({
          organizationId,
          projectId,
          token,
          page: currentPage,
          size: pageSize,
          documentNameContains: documentNameContains || undefined,
          sort
        })
      )
    }
  }, [organizationId, projectId, currentPage, pageSize, documentNameContains, sort, dispatch, token, user])

  useEffect(() => {
    if (!documents.length && !documentNameContains) {
      setViewMode('grid')
    }
  }, [documents, documentNameContains])

  useEffect(() => {
    if (viewMode !== 'grid') {
      setShowAll(true)
    }
  }, [viewMode])

  // Mount list in the background after first paint so switching to it is instant.
  // Hidden via display:none; pagination mount noise is ignored in DocumentsList.
  useEffect(() => {
    if (!documents.length || listMounted || isMobile) return undefined

    let idleId
    let timeoutId

    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(() => setListMounted(true))
    } else {
      timeoutId = window.setTimeout(() => setListMounted(true), 150)
    }

    return () => {
      if (idleId != null && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId)
      }
      if (timeoutId != null) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [documents.length, listMounted, isMobile])

  const handlePageChange = newPage => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage)
    }
  }

  const handleDocumentSearch = useCallback(searchValue => {
    setCurrentPage(0)
    setDocumentNameContains(searchValue)
  }, [])

  const handleListPaginationChange = useCallback(
    model => {
      const nextPage = Number(model.page)
      const nextPageSize = Number(model.pageSize)

      if (nextPage === currentPage && nextPageSize === pageSize) {
        return
      }
      if (nextPageSize !== pageSize) {
        setPageSize(nextPageSize)
        setCurrentPage(0)
        return
      }
      setCurrentPage(nextPage)
    },
    [currentPage, pageSize]
  )

  const handleListSortModelChange = useCallback(
    nextSortModel => {
      const nextSort = sortModelToParam(nextSortModel)
      if (nextSort === sort) return
      setSort(nextSort)
      setCurrentPage(0)
    },
    [sort]
  )

  const toggleViewMode = mode => {
    if (mode === 'list') {
      setListMounted(true)
    }
    setViewMode(mode)
  }

  return projectId && projectId !== 'null' ? (
    <ResponsiveCardContent
      sx={{
        backgroundColor: 'action.hover',
        filter: isBlurring ? 'blur(6px)' : 'none',
        transition: 'filter 0.3s ease'
      }}
      aria-busy={isBlurring}
    >
      {/* Header Section */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: documents.length || documentNameContains ? 4 : 0
        }}
      >
        <Typography variant='h5' sx={{ fontWeight: 600, textAlign: 'left' }}>
          Recent Documents
        </Typography>
        {(documents.length > 0 || documentNameContains) && (
          <Box
            sx={{
              display: 'flex',
              gap: 2
            }}
          >
            <Tooltip title='Grid View'>
              <IconButton
                onClick={() => toggleViewMode('grid')}
                color={viewMode === 'grid' ? 'primary' : 'default'}
                sx={{ fontSize: '3rem' }}
              >
                <Icon icon='mdi:view-grid-outline' fontSize='inherit' />
              </IconButton>
            </Tooltip>
            {!isMobile && (
              <Tooltip title='List View'>
                <IconButton
                  onClick={() => toggleViewMode('list')}
                  color={viewMode === 'list' ? 'primary' : 'default'}
                  sx={{ fontSize: '3rem' }}
                >
                  <Icon icon='mdi:view-list-outline' fontSize='inherit' />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
      </Box>

      <Box sx={{ display: viewMode === 'grid' ? 'block' : 'none' }}>
        <DocumentsGrid
          documents={documents}
          showAll={showAll}
          setShowAll={setShowAll}
          page={currentPage}
          pageSize={pageSize}
          documentNameContains={documentNameContains}
          sort={sort}
        />
      </Box>

      {listMounted && (
        <Box sx={{ display: viewMode === 'list' ? 'block' : 'none' }}>
          <DocumentsList
            documents={documents}
            page={currentPage}
            pageSize={pageSize}
            totalElements={totalElements}
            documentNameContains={documentNameContains}
            sort={sort}
            sortModel={sortModel}
            onSearch={handleDocumentSearch}
            onPaginationModelChange={handleListPaginationChange}
            onSortModelChange={handleListSortModelChange}
          />
        </Box>
      )}

      {viewMode === 'grid' && showAll && totalPages > 0 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mt: 4
          }}
        >
          <Button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0} sx={{ mr: 2 }}>
            Previous
          </Button>
          <Typography sx={{ mt: 1.5 }}>{`Page ${currentPage + 1} of ${totalPages}`}</Typography>
          <Button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
            sx={{ ml: 2 }}
          >
            Next
          </Button>
        </Box>
      )}

      {/* Empty State */}
      {!documents.length && (
        <Typography variant='body2' sx={{ textAlign: 'center', mt: 40, color: 'text.secondary' }}>
          {documentNameContains
            ? 'No documents match your search.'
            : 'No documents available. Please create or upload new documents.'}
        </Typography>
      )}
    </ResponsiveCardContent>
  ) : (
    <CardContent
      sx={{
        display: 'flex',
        textAlign: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        backgroundSize: 'cover',
        py: theme => `${theme.spacing(25)} !important`,
        backgroundImage: theme => `url(/images/pages/pages-header-bg-${theme.palette.mode}.png)`
      }}
    >
      <Typography
        variant='h5'
        sx={{
          fontWeight: 600,
          fontSize: '1.5rem !important',
          color: 'primary.main'
        }}
      >
        Hello, would you like to create a new document?
      </Typography>
      <Box mt={10}>
        <Typography variant='body2'>or choose an action from the buttons above</Typography>
      </Box>
    </CardContent>
  )
}

export default Documents
