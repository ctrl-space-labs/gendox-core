import React from 'react'
import {
  Card,
  Box,
  CircularProgress,
  List,
  Typography,
  ListItem,
  ListItemButton,
  ListItemText,
  Tooltip
} from '@mui/material'
import Divider from '@mui/material/Divider'
import Icon from 'src/views/custom-components/mui/icon/icon'
import CustomAvatar from 'src/views/custom-components/mui/avatar'
import { useTheme } from '@mui/material/styles'
import IconButton from "@mui/material/IconButton";

const ChatInsightSourcesContent = ({ isLoadingMetadata, currentMessageMetadata }) => {
  const theme = useTheme()

  // Click handler for a source: open its documentUrl or externalUrl in a new tab
  const handleSourceClick = sectionData => {
    let link = `/gendox/document-instance/?organizationId=${sectionData.organizationId}&documentId=${sectionData.documentId}&sectionId=${sectionData.sectionId}`

    if (sectionData?.externalUrl) {
      link = sectionData.externalUrl
    }
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer')
    }
  }

  // Show a loading indicator if metadata is loading
  if (isLoadingMetadata) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%'
        }}
      >
        <CircularProgress disableShrink />
      </Box>
    )
  }

  // Split metadata into two groups based on isCompletionParticipant
  const completionParticipants = currentMessageMetadata?.metadata?.filter(item => item.isCompletionParticipant) || []
  const nonCompletionParticipants =
    currentMessageMetadata?.metadata?.filter(item => !item.isCompletionParticipant) || []

  // If no metadata is found, display a message
  if (completionParticipants.length === 0 && nonCompletionParticipants.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%'
        }}
      >
        <Typography variant='body2' sx={{ textAlign: 'center', mt: 2 }}>
          Select a message to view sources
        </Typography>
      </Box>
    )
  }

  // Render a list item
  const renderListItem = (sectionMetadata, key) => (
    <Tooltip key={key} title={sectionMetadata.sectionTitle}>
      <ListItem onClick={() => handleSourceClick(sectionMetadata)} sx={{ padding: '0px' }}>
        <ListItemButton sx={{ display: 'flex', alignItems: 'center' }}>
          <CustomAvatar skin='light' color='primary' variant='rounded' sx={{ mr: 3, height: '1.25rem', width: '1.25rem' }}>
            <Icon icon='mdi:file' />
          </CustomAvatar>
          <ListItemText
            primary={sectionMetadata.documentTitle}
            secondary={`${sectionMetadata.sectionValue}...`}
            sx={{
              ml: 3,
              mr: 3,
              '& .MuiTypography-body1': {
                color: theme.palette.primary.main
              }
            }}
            secondaryTypographyProps={{
              sx: {
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }
            }}
          />
          <CustomAvatar skin='light' color='primary' variant='rounded' sx={{ mr: 3, height: '1.25rem', width: '1.25rem' }}>
            <Icon icon='mdi:open-in-new'  />
          </CustomAvatar>
        </ListItemButton>
      </ListItem>
    </Tooltip>
  )

  return (
    <Card sx={{ backgroundColor: 'transparent', boxShadow: 'none', p: 2 }}>
      {completionParticipants.length > 0 && (
        <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <List disablePadding sx={{ width: '100%' }}>
            {completionParticipants.map((sectionMetadata, index) =>
              renderListItem(sectionMetadata, `completion-${index}`)
            )}
          </List>
        </Box>
      )}

      {nonCompletionParticipants.length > 0 && (
        <>
          <Divider sx={{my: 2}}>
            Additional Sources
            <Tooltip
              title="Additional sources providing further context, though not directly referenced in generating the answer.">
              <IconButton color="secondary" sx={{ml: 1}}>
                <Icon icon="mdi:information-outline" style={{fontSize: '1.25rem'}}/>
              </IconButton>
            </Tooltip>
          </Divider>
          <Box sx={{mt: 6}}>
            <List disablePadding>
              {nonCompletionParticipants.map((sectionMetadata, index) =>
                renderListItem(sectionMetadata, `nonCompletion-${index}`)
              )}
            </List>
          </Box>
        </>
      )}
    </Card>
  )
}

export default ChatInsightSourcesContent
