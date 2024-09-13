// ** MUI Imports
import Drawer from '@mui/material/Drawer'
import Button from '@mui/material/Button'
import { styled } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Custom Components Imports
import CustomChip from 'src/@core/components/mui/chip'

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(3, 4),
  justifyContent: 'space-between',
  backgroundColor: theme.palette.background.default
}))

const SendInvitation = ({ open, toggle }) => {
  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={toggle}
      sx={{ '& .MuiDrawer-paper': { width: [300, 400] } }}
      ModalProps={{ keepMounted: true }}
    >
      <Header>
        <Typography variant='h6'>Send Invite</Typography>
        <IconButton size='small' onClick={toggle} sx={{ color: 'text.primary' }}>
          <Icon icon='mdi:close' fontSize={20} />
        </IconButton>
      </Header>
      <Box sx={{ p: 5 }}>
        <FormControl fullWidth sx={{ mb: 6 }}>
          <TextField type='email' label='From' variant='outlined' defaultValue='myemail@email.com' />
        </FormControl>
        <FormControl fullWidth sx={{ mb: 6 }}>
          <TextField type='email' label='To' variant='outlined'  />
        </FormControl>
        <FormControl fullWidth sx={{ mb: 6 }}>
          <TextField label='Subject' variant='outlined' defaultValue='Invitation to Join Organization' />
        </FormControl>
        <FormControl fullWidth sx={{ mb: 6 }}>
          <TextField
            rows={10}
            multiline
            label='Message'
            type='textarea'
            variant='outlined'
            defaultValue={`Dear [Recipient Name],
            We are pleased to invite you to join our exciting AI project. This initiative is designed to harness cutting-edge artificial intelligence to solve important challenges.

            Please let us know if you are interested, and we will provide you with further details and steps to get started.
            
            Best regards,
            [Your Name]
            [Your Organization]`}
          />
        </FormControl>
        {/* <Box sx={{ mb: 6 }}>
          <CustomChip
            size='small'
            skin='light'
            color='primary'
            label='Invoice Attached'
            sx={{ borderRadius: '5px' }}
            icon={<Icon icon='mdi:attachment' fontSize={20} />}
          />
        </Box> */}
        <div>
          <Button size='large' variant='contained' onClick={toggle} sx={{ mr: 4 }}>
            Send
          </Button>
          <Button size='large' variant='outlined' color='secondary' onClick={toggle}>
            Cancel
          </Button>
        </div>
      </Box>
    </Drawer>
  )
}

export default SendInvitation
