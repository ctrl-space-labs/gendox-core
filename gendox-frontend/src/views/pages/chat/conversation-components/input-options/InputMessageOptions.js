import { Box, Tooltip } from '@mui/material'
import Icon from 'src/views/custom-components/mui/icon/icon'
import Chip from 'src/views/custom-components/mui/chip'

const InputMessageOptions = ({ deepThinkingEnabled = false, onDeepThinkingToggle }) => {
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
      <Tooltip title={deepThinkingEnabled ? 'Disable deep thinking' : 'Enable deep thinking'}>
        <Chip
          onClick={onDeepThinkingToggle}
          icon={<Icon icon='mdi:brain' />}
          label='Deep Thinking'
          color={deepThinkingEnabled ? 'primary' : 'secondary'}
          variant='outlined'
          rounded
        />
      </Tooltip>
    </Box>
  )
}
export default InputMessageOptions