import React, { useState } from 'react'
import { Paper, Box, InputBase, Menu, MenuItem, Divider, IconButton } from '@mui/material'
import Icon from 'src/views/custom-components/mui/icon/icon'
import Chip from 'src/views/custom-components/mui/chip'
import { sendMessage } from 'src/store/chat/gendoxChat'
import { useIFrameMessageManager } from '../../../../authentication/context/IFrameMessageManagerContext'
import { Tooltip } from '@mui/material'

const ChatInputSection = ({ auth, dispatch, token, currentThread, organizationId, isSending, isLoadingMessages }) => {
  const iFrameMessageManager = useIFrameMessageManager()

  // Message text
  const [message, setMessage] = useState('')

  // Send message logic
  const handleSend = () => {
    if (isSending) return
    if (!message.trim()) return
    setMessage('')

    dispatch(
      // sendMessage({
      //   message: inputValue,
      //   threadId: currentThread?.id, // or however your logic is structured
      // })
      sendMessage({
        user: auth.user,
        currentThread,
        message,
        organizationId,
        iFrameMessageManager,
        token
      })
    )
  }

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column', // Stack rows
        backgroundColor: 'background.paper',
        borderRadius: 2,
        gap: 2,
        filter: isLoadingMessages ? 'blur(6px)' : 'none'
      }}
    >
      {/* Row 1: Input area + Send icon */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          filter: isLoadingMessages ? 'blur(6px)' : 'none'
        }}
      >
        <InputBase
          placeholder='Ask anything...'
          multiline
          maxRows={4}
          fullWidth
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyPress={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          sx={{ mr: 2 }}
        />

        {/* Send button (icon) */}
        <IconButton
          onClick={handleSend}
          sx={{
            filter: isSending ? 'blur(6px)' : 'none'
          }}
        >
          <Icon icon='mdi:send' />
        </IconButton>
      </Box>

      {/* Row 2: Search, Attach, Copilot, More chips */}
      <InputMessageOptions />
    </Paper>
  )
}

const InputMessageOptions = () => {
  // Menu anchor state (for the "More" chip)
  const [anchorEl, setAnchorEl] = useState(null)

  // Toggle states
  const [copilotEnabled, setCopilotEnabled] = useState(false)

  // Menu open/close
  const handleMenuOpen = event => {
    setAnchorEl(event.currentTarget)
  }
  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  // Example toggler for the Copilot chip
  const handleCopilotToggle = () => {
    setCopilotEnabled(!copilotEnabled)
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}
    >
      {/* Search Chip */}
      <Tooltip title='Coming soon'>
        <Chip
          onClick={() => console.log('Search clicked')}
          icon={<Icon icon='mdi:magnify' />}
          label='Search'
          color='secondary'
          variant='outlined'
          rounded
        />
      </Tooltip>

      {/*/!* Attach Chip *!/*/}
      {/*<Chip*/}
      {/*  onClick={() => console.log('Attach file')}*/}
      {/*  icon={<Icon icon='mdi:plus' />}*/}
      {/*  color='secondary'*/}
      {/*  variant='outlined'*/}
      {/*  rounded*/}
      {/*  // sx={{*/}
      {/*  //   '& .MuiChip-label': {*/}
      {/*  //     paddingLeft: 0,*/}
      {/*  //   }*/}
      {/*  // }}*/}
      {/*  // no label, just icon*/}
      {/*/>*/}

      {/*/!* Copilot Chip (toggles) *!/*/}
      {/*<Chip*/}
      {/*  onClick={handleCopilotToggle}*/}
      {/*  icon={<Icon icon='mdi:robot' />}*/}
      {/*  label='Copilot'*/}
      {/*  color={copilotEnabled ? 'warning' : 'secondary'}*/}
      {/*  variant='outlined'*/}
      {/*  rounded*/}
      {/*/>*/}

      {/*/!* More Chip (opens menu) *!/*/}
      {/*<Chip*/}
      {/*  onClick={handleMenuOpen}*/}
      {/*  icon={<Icon icon='mdi:dots-vertical' />}*/}
      {/*  color='primary'*/}
      {/*  variant='outlined'*/}
      {/*  rounded*/}
      {/*/>*/}
      {/*<Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} PaperProps={{ sx: { mt: 1 } }}>*/}
      {/*  <MenuItem*/}
      {/*    onClick={() => {*/}
      {/*      handleMenuClose()*/}
      {/*      console.log('Action 1')*/}
      {/*    }}*/}
      {/*  >*/}
      {/*    Action 1*/}
      {/*  </MenuItem>*/}
      {/*  <MenuItem*/}
      {/*    onClick={() => {*/}
      {/*      handleMenuClose()*/}
      {/*      console.log('Action 2')*/}
      {/*    }}*/}
      {/*  >*/}
      {/*    Action 2*/}
      {/*  </MenuItem>*/}
      {/*  <Divider />*/}
      {/*  <MenuItem*/}
      {/*    onClick={() => {*/}
      {/*      handleMenuClose()*/}
      {/*      console.log('Action 3')*/}
      {/*    }}*/}
      {/*  >*/}
      {/*    Action 3*/}
      {/*  </MenuItem>*/}
      {/*</Menu>*/}
    </Box>
  )
}
export default ChatInputSection
