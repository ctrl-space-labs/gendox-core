import React from 'react'
import Button from '@mui/material/Button'
import Icon from 'src/@core/components/icon'

const ButtonComponent = ({ text, onClick }) => {
  return (
    <Button
      size='large'
      variant='contained'
      sx={{
        borderRadius: '20px',
        borderColor: '#01989F',
        textTransform: 'none',
        '&:hover': {
          bgcolor: 'transparent',
          color: '#01989F'
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
