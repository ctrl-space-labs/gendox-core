import React from 'react'
import { List } from '@mui/material'
import { Box, Typography } from '@mui/material'
import ScrollWrapper from 'src/views/custom-components/perfect-scroll/ScrollWrapper'
import VerticalNavLink from 'src/@core/layouts/components/vertical/navigation/VerticalNavLink'
import { AgentAvatar } from 'src/views/pages/chat/utils/chatUtils'

const ChatAgents = ({ agents, chatUrlPath, onClose, projectId, organizationId, hidden, searchQuery }) => {  
  const selectedAgentId = agents?.find(a => a.projectId === projectId)?.id || null 

  const filteredAgents = searchQuery
    ? agents.filter(agent => agent.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
    : agents

  return (
    <Box sx={{ flex: 1, minHeight: 0 }}>
      <ScrollWrapper hidden={hidden} style={{ height: '100%' }}>
        {filteredAgents && filteredAgents.length > 0 && (
          <>
            <Typography variant='h6' gutterBottom color='primary'>
              Agents
            </Typography>
            <List disablePadding>
              {filteredAgents.map(agent => (
                <VerticalNavLink
                  key={agent.id}
                  item={{
                    path: `${chatUrlPath}/?organizationId=${organizationId}&projectId=${agent.projectId}`,
                    icon: () => (
                      <AgentAvatar
                        isSelected={agent.id === selectedAgentId}
                        fullName={agent.fullName}
                      />
                    ),
                    title: agent.fullName,
                    subtitle: agent.description
                  }}
                  navVisible
                  toggleNavVisibility={onClose}
                />
              ))}
            </List>
          </>
        )}
      </ScrollWrapper>
    </Box>
  )
}

export default ChatAgents
