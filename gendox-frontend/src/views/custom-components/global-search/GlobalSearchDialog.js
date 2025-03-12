// ** React Imports
import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useRouter } from 'next/router'
import CustomAvatar from 'src/views/custom-components/mui/avatar'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import ScrollWrapper from 'src/views/custom-components/perfect-scroll/ScrollWrapper'
import Box from '@mui/material/Box'
import Chip from 'src/views/custom-components/mui/chip'
import Typography from '@mui/material/Typography'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import List from '@mui/material/List'
import useMediaQuery from '@mui/material/useMediaQuery'
import ListItemText from '@mui/material/ListItemText'
import IconButton from '@mui/material/IconButton'
import Icon from 'src/views/custom-components/mui/icon/icon'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import { localStorageConstants } from 'src/utils/generalConstants'
import { useTheme } from '@mui/material/styles'
import CircularProgress from '@mui/material/CircularProgress'
import { fetchCloserSectionsFromProject, resetCloserDocuments } from 'src/store/globalSearch/globalSearch'

const GlobalSearchDialog = ({ globalSearchDialogOpen, closeGlobalSearchDialog, user }) => {
  const dispatch = useDispatch()
  const theme = useTheme()
  const router = useRouter()
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)

  const [searchValue, setSearchValue] = useState('')
  const [debounceTimeout, setDebounceTimeout] = useState(null)
  const [activeTab, setActiveTab] = useState('agents')
  const [projectDocumentOptions, setProjectDocumentOptions] = useState([])
  const [agentOptions, setAgentOptions] = useState([])
  const [documentsPage, setDocumentsPage] = useState(0)
  const [noMoreDocuments, setNoMoreDocuments] = useState(false)
  const projectId = router.query.projectId
  const [errorMessage, setErrorMessage] = useState('')
  const { closerDocumentsFromProject, loading } = useSelector(state => state.globalSearch)
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const resetDocumentState = () => {
    setProjectDocumentOptions([])
    setDocumentsPage(0)
    setNoMoreDocuments(false)
    dispatch(resetCloserDocuments())
  }

  const resetDialogState = () => {
    setSearchValue('')
    setAgentOptions([])
    resetDocumentState()
  }

  const handleSearchChange = event => {
    const newSearchValue = event.target.value
    setSearchValue(event.target.value)
    resetDocumentState()

    if (activeTab !== 'documents') return
    if (debounceTimeout) {
      clearTimeout(debounceTimeout)
    }
    const timeoutId = setTimeout(() => {
      if (newSearchValue.length > 2) {
        fetchCloserSections(0)
      }
    }, 1000)
    setDebounceTimeout(timeoutId)
  }

  const fetchCloserSections = page => {
    if (!projectId) {
      setErrorMessage('Please select a project.')
      return // Do not fetch if projectId is missing
    }
    dispatch(
      fetchCloserSectionsFromProject({
        message: searchValue,
        projectId: projectId,
        size: 5,
        page: page,
        token: token
      })
    )
  }

  useEffect(() => {
    if (activeTab === 'agents') {
      resetDocumentState()
    }
  }, [activeTab, dispatch])

  useEffect(() => {
    if (user?.organizations) {
      const agents = user.organizations.flatMap(org =>
        org.projectAgents
          .filter(agent => agent.agentName.toLowerCase().includes(searchValue.toLowerCase()))
          .map(agent => ({
            title: agent.agentName,
            orgTitle: org.name,
            icon: 'mdi:account',
            category: 'Project Agents',
            optionId: agent.id,
            link: `/gendox/chat/?organizationId=${org.id}&threadId=${agent.userId}`
          }))
      )
      setAgentOptions(agents)
    }
  }, [user, searchValue])

  useEffect(() => {
    if (closerDocumentsFromProject?.length > 0) {
      setNoMoreDocuments(false)
      const documents = closerDocumentsFromProject.map(documentSection => {
        const sectionValue = documentSection.sectionValue.split(' ').slice(0, 20).join(' ')

        return {
          title: documentSection.documentInstanceDTO.title,
          sectionOrder: documentSection.documentSectionMetadata.sectionOrder,
          sectionValue: sectionValue,
          icon: 'mdi:file-document',
          category: 'Documents',
          optionId: documentSection.id,
          link: `/gendox/document-instance/?organizationId=${documentSection.documentInstanceDTO.organizationId}&documentId=${documentSection.documentInstanceDTO.id}&sectionId=${documentSection.id}&projectId=${projectId}`
        }
      })
      setProjectDocumentOptions(prevDocuments => [...prevDocuments, ...documents])
    } else if (closerDocumentsFromProject?.length < 1) {
      setNoMoreDocuments(true)
    }
  }, [closerDocumentsFromProject, projectId, dispatch])

  const navigateToSelectedOption = selectedOption => {
    setSearchValue('')
    closeGlobalSearchDialog()
    if (selectedOption.link) {
      router.push(selectedOption.link)
    }
  }

  const handleLoadMore = () => {
    const nextPage = documentsPage + 1
    setDocumentsPage(nextPage)
    fetchCloserSections(nextPage)
  }

  return (
    <Dialog
      fullWidth
      open={globalSearchDialogOpen}
      onClose={() => {
        closeGlobalSearchDialog()
      }}
    >
      <DialogContent sx={{ padding: 2, minHeight: 500 }}>
        <TextField
          autoFocus
          fullWidth
          value={searchValue}
          onChange={handleSearchChange}
          placeholder='Search'
          variant='standard'
          sx={{
            mt: 3,
            height: 55,
            borderBottom: `1px solid ${theme.palette.divider}`,
            // Optionally adjust the inner input styling
            '& .MuiInputBase-input': { py: 1 }
          }}
          InputProps={{
            disableUnderline: true,
            sx: { px: 2 },
            startAdornment: (
              <InputAdornment position='start' sx={{ color: 'text.primary' }}>
                <Icon icon='mdi:magnify' />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position='end'>
                <IconButton
                  onClick={e => {
                    e.stopPropagation()
                    closeGlobalSearchDialog()
                    resetDialogState()
                  }}
                >
                  <Icon icon='mdi:close' fontSize='1rem' />
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        <Box
          sx={{
            height: 60,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            display: 'flex',
            ml: 2,
            mt: 3,
            justifyContent: 'flex-end'
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px',
              borderRadius: '5994px',
              bgcolor: theme.palette.background.default,
              boxSizing: 'border-box'
            }}
          >
            {/* "Agent" Chip */}
            <Chip
              label='Agents'
              clickable // or onClick alone
              onClick={() => setActiveTab('agents')}
              // Conditionally style when selected or not:
              color={activeTab === 'agents' ? 'primary' : 'secondary'}
              variant={'outlined'}
              theme={theme}
              sx={{
                borderRadius: 999, // make it pill-shaped
                mr: 1
                // Optionally override default background colors, etc.
              }}
            />

            {/* “Sources” Chip */}
            <Chip
              label={'Documents'}
              clickable
              onClick={() => setActiveTab('documents')}
              color={activeTab === 'documents' ? 'primary' : 'secondary'}
              variant={'outlined'}
              theme={theme}
              sx={{ borderRadius: 999 }}
            />
          </Box>
        </Box>
        <Box sx={{ marginTop: 2 }}>
          <ScrollWrapper sx={{ flexGrow: 1, px: 2 }} hidden={isMobile}>
            {searchValue.length > 2 ? (
              <List>
                {activeTab === 'agents' ? (
                  agentOptions.length > 0 ? (
                    agentOptions.map(option => (
                      <ListItem
                        key={option.optionId}
                        onClick={() => navigateToSelectedOption(option)}
                        sx={{ padding: '0px' }}
                      >
                        <ListItemButton>
                          <CustomAvatar skin='light' variant='rounded' sx={{ mr: 3, height: 20, width: 20 }}>
                            <Icon icon='mdi:account' />
                          </CustomAvatar>

                          <ListItemText
                            primary={option.title}
                            secondary={option.orgTitle + ' - Organization'}
                            sx={{
                              ml: 3,
                              '& .MuiTypography-body1': {
                                color: theme.palette.primary.main
                              }
                            }}
                          />
                          <Tooltip title='Chat with Agent'>
                            <CustomAvatar skin='light' variant='rounded' sx={{ mr: 3, height: 20, width: 20 }}>
                              <Icon icon='mdi:subdirectory-arrow-left' fontSize={20} sx={{ p: 2 }} />
                            </CustomAvatar>
                          </Tooltip>
                        </ListItemButton>
                      </ListItem>
                    ))
                  ) : (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        mt: 5
                      }}
                    >
                      <Typography variant='body2' sx={{ mb: 2.5, color: 'text.disabled', textAlign: 'center' }}>
                        No results found for your search query. <br />
                        Please try a different keyword or check your spelling.
                      </Typography>
                    </Box>
                  )
                ) : null}

                {activeTab === 'documents'
                  ? projectDocumentOptions.map(option => (
                      <ListItem
                        key={`${option.optionId}-${option.title}`}
                        onClick={() => navigateToSelectedOption(option)}
                        sx={{ padding: '0px' }}
                      >
                        <ListItemButton sx={{ display: 'flex', alignItems: 'center' }}>
                          <CustomAvatar skin='light' variant='rounded' sx={{ mr: 3, height: 20, width: 20 }}>
                            <Icon icon='mdi:file-document' />
                          </CustomAvatar>
                          <ListItemText
                            primary={option.title}
                            secondary={option.sectionValue + '...'}
                            sx={{
                              ml: 3,
                              mr: 3,
                              '& .MuiTypography-body1': {
                                color: theme.palette.primary.main
                              }
                            }}
                          />
                          <Tooltip title='Access Document'>
                            <CustomAvatar skin='light' variant='rounded' sx={{ mr: 3, height: 20, width: 20 }}>
                              <Icon icon='mdi:subdirectory-arrow-left' fontSize={20} />
                            </CustomAvatar>
                          </Tooltip>
                        </ListItemButton>
                      </ListItem>
                    ))
                  : null}
              </List>
            ) : null}

            {searchValue.length > 2 && activeTab === 'documents' && !loading && (
              <Box sx={{ marginTop: 2 }}>
                {errorMessage ? (
                  <Box sx={{ textAlign: 'center', color: 'error.main' }}>
                    <Typography variant='body2'>{errorMessage}</Typography>
                  </Box>
                ) : noMoreDocuments ? (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      mt: 5
                    }}
                  >
                    <Typography variant='body2' sx={{ mb: 2.5, color: 'text.disabled', textAlign: 'center' }}>
                      No more documents available.
                    </Typography>
                  </Box>
                ) : projectDocumentOptions.length > 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Button
                      onClick={handleLoadMore}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: 14,
                        textTransform: 'none'
                      }}
                      variant='outlined'
                    >
                      <Typography sx={{ marginRight: 1 }}>Load More</Typography>
                      <Icon icon='mdi:arrow-down' />
                    </Button>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      mt: 5
                    }}
                  >
                    <Typography variant='body2' sx={{ mb: 2.5, color: 'text.disabled', textAlign: 'center' }}>
                      No results found for your search query. <br />
                      Please try a different keyword or check your spelling.
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Show loader only if more documents are loading */}
            {searchValue.length > 2 && activeTab === 'documents' && loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 2 }}>
                <CircularProgress />
              </Box>
            )}
          </ScrollWrapper>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default GlobalSearchDialog
