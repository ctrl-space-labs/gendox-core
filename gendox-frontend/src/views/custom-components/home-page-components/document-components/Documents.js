import React, { useState, useEffect } from 'react'
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
import { fetchProjectDocuments } from 'src/store/activeProject/activeProject'
import { isValidOrganizationAndProject } from 'src/utils/validators'

const Documents = () => {
  const { user } = useAuth()

  const router = useRouter()
  const dispatch = useDispatch()

  const { organizationId, projectId } = router.query
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)
  const { projectDocuments, isBlurring } = useSelector(state => state.activeProject)
  const { content: documents, totalPages } = projectDocuments

  const [viewMode, setViewMode] = useState('grid')
  const [currentPage, setCurrentPage] = useState(0)
  const [showAll, setShowAll] = useState(false)

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  useEffect(() => {
    setCurrentPage(0)
  }, [projectId])

  useEffect(() => {
    if (isValidOrganizationAndProject(organizationId, projectId, user)) {
      dispatch(
        fetchProjectDocuments({
          organizationId,
          projectId,
          token,
          page: currentPage
        })
      )
    }
  }, [organizationId, projectId, currentPage, dispatch])

  useEffect(() => {
    if (!documents.length) {
      setViewMode('grid')
    }
  }, [documents])

  useEffect(() => {
    if (viewMode !== 'grid') {
      setShowAll(true)
    }
  }, [viewMode])

  const handlePageChange = newPage => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage)
    }
  }

  const toggleViewMode = mode => {
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
          mb: documents.length ? 4 : 0 // Add margin only if documents exist
        }}
      >
        <Typography variant='h5' sx={{ fontWeight: 600, textAlign: 'left' }}>
          Recent Documents
        </Typography>
        {/* {documents.length > 0 && (
          <Box
            sx={{
              display: "flex",
              gap: 2,
            }}
          >
            <Tooltip title="Grid View">
              <IconButton
                onClick={() => toggleViewMode("grid")}
                color={viewMode === "grid" ? "primary" : "default"}
                sx={{ fontSize: "3rem" }}
              >
                <Icon icon="mdi:view-grid-outline" fontSize="inherit" />
              </IconButton>
            </Tooltip>
            {!isMobile && (
              <Tooltip title="List View">
                <IconButton
                  onClick={() => toggleViewMode("list")}
                  color={viewMode === "list" ? "primary" : "default"}
                  sx={{ fontSize: "3rem" }}
                >
                  <Icon icon="mdi:view-list-outline" fontSize="inherit" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )} */}
      </Box>

      {viewMode === 'grid' ? (
        <DocumentsGrid documents={documents} showAll={showAll} setShowAll={setShowAll} page={currentPage} />
      ) : (
        <DocumentsList documents={documents} page={currentPage} />
      )}

      {showAll && (
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
            disabled={currentPage === totalPages - 1}
            sx={{ ml: 2 }}
          >
            Next
          </Button>
        </Box>
      )}

      {/* Empty State */}
      {!documents.length && (
        <Typography variant='body2' sx={{ textAlign: 'center', mt: 40, color: 'text.secondary' }}>
          No documents available. Please create or upload new documents.
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
