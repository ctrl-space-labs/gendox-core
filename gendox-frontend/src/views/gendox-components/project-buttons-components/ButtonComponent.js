import React from 'react'
import Button from '@mui/material/Button'
import Icon from 'src/@core/components/icon'

const ButtonComponent = ({ text, onClick }) => {
  return (
    <Button
      size='large'
      variant='outlined'
      color='primary'
      sx={{
        borderRadius: '8px',
        textTransform: 'none',
        '&:hover': {
          bgcolor: 'transparent'
        }
      }}
      startIcon={<Icon icon="mdi:plus" />}
      onClick={onClick}
    >
      {text}
    </Button>
  )
}

export default ButtonComponent
