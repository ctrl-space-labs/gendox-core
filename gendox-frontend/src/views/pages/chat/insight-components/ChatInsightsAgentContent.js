import { useState, useEffect } from 'react'
import { Box, Card, CircularProgress, Typography, Divider, Grid } from '@mui/material'
import { format, parseISO } from 'date-fns'
import { Badge, Button, IconButton, List, ListItem, ListItemIcon, ListItemText } from '@mui/material'
import Icon from 'src/views/custom-components/mui/icon/icon'
import UserIcon from 'src/layouts/components/UserIcon'
import CustomAvatar from 'src/views/custom-components/mui/avatar'
import Link from 'next/link'
import { Fragment } from 'react'
import { useSelector } from 'react-redux'
import { AgentAvatar } from 'src/views/pages/chat/utils/chatUtils'

import { useRouter } from 'next/router'

const ChatInsightAgentContent = ({ projectId, currentThread }) => {
  const router = useRouter()
  const { organizationId } = router.query

  const { projectDetails: project, isUpdatingProject } = useSelector(state => state.activeProject)

  const projectAgent = project?.projectAgent

  if (isUpdatingProject) {
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

  return (
    <Card sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
      {currentThread && projectAgent ? (
        <Fragment>
          <Box sx={{ position: 'relative', p: 3 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
              <ListItemIcon
                sx={{
                  mr: 2.5,
                  color: 'text.primary',
                  transition: 'margin .25s ease-in-out'
                }}
              >
                <UserIcon icon={() => <AgentAvatar isSelected={false} fullName={currentThread?.agent?.fullName} />} />
              </ListItemIcon>
            </Box>
            <Typography sx={{ mb: 0.75, fontWeight: 600, textAlign: 'center' }}>{projectAgent.agentName}</Typography>
            <Typography variant='body2' sx={{ textAlign: 'center' }}>
              Project Agent
            </Typography>
          </Box>
          <Box sx={{ height: 'calc(100% - 13rem)' }}>
            <Box sx={{ px: 3, py: 2 }}>
              <Typography variant='h6' sx={{ mb: 2 }}>
                Agent Details
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Icon icon='mdi:brain' />
                  </ListItemIcon>
                  <ListItemText primary='Completion Model' secondary={projectAgent.completionModel?.name || 'N/A'} />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Icon icon='mdi:magnify' />
                  </ListItemIcon>
                  <ListItemText
                    primary='Semantic Search Model'
                    secondary={projectAgent.semanticSearchModel?.name || 'N/A'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Icon icon='mdi:shield-check-outline' />
                  </ListItemIcon>
                  <ListItemText
                    primary='Moderation Check'
                    secondary={projectAgent.moderationCheck ? `${projectAgent.moderationModel?.name}` : 'No'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Icon icon='mdi:refresh' />
                  </ListItemIcon>
                  <ListItemText
                    primary='Rerank'
                    secondary={projectAgent.rerankEnable ? `${projectAgent.rerankModel?.name}` : 'Disabled'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Icon icon='mdi:file-document-outline' />
                  </ListItemIcon>
                  <ListItemText
                    primary='Document Splitter'
                    secondary={projectAgent.documentSplitterType?.name || 'N/A'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Icon icon='mdi:thermometer-lines' />
                  </ListItemIcon>
                  <ListItemText primary='Max Tokens' secondary={projectAgent.maxToken || 'N/A'} />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Icon icon='mdi:coolant-temperature' />
                  </ListItemIcon>
                  <ListItemText primary='Temperature' secondary={projectAgent.temperature || 'N/A'} />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Icon icon='mdi:format-list-numbered' />
                  </ListItemIcon>
                  <ListItemText primary='Top P' secondary={projectAgent.topP || 'N/A'} />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Icon icon='mdi:scale-balance' />
                  </ListItemIcon>
                  <ListItemText primary='Max Search Limit' secondary={projectAgent.maxSearchLimit || 'N/A'} />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <Icon icon='mdi:chart-line' />
                  </ListItemIcon>
                  <ListItemText primary='Max Completion Limit' secondary={projectAgent.maxCompletionLimit || 'N/A'} />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Icon icon='mdi:calendar-clock' />
                  </ListItemIcon>
                  <ListItemText
                    primary='Created At'
                    secondary={projectAgent.createdAt ? format(parseISO(projectAgent.createdAt), 'PPP') : 'N/A'}
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <Icon icon='mdi:account-key-outline' />
                  </ListItemIcon>
                  <ListItemText
                    primary='Agent Visibility'
                    secondary={projectAgent.privateAgent ? 'Private Agent' : 'Public Agent'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Icon icon='mdi:gesture-tap-button' />
                  </ListItemIcon>
                  <ListItemText primary='Agent Behavior' secondary={projectAgent.agentBehavior || 'N/A'} />
                </ListItem>
              </List>
              <Link
                href={`/gendox/project-settings/?organizationId=${organizationId}&projectId=${projectId}`}
                passHref
                target='_blank'
              >
                <Button variant='contained' color='primary' fullWidth>
                  Edit Agent
                </Button>
              </Link>
            </Box>
          </Box>
        </Fragment>
      ) : null}
    </Card>
  )
}

export default ChatInsightAgentContent
