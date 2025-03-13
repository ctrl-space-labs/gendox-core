'use client'

// React Imports
import { forwardRef } from 'react'

// MUI Imports
import MuiChip from '@mui/material/Chip'
import { styled } from '@mui/material/styles'
import { hexToRGBA } from 'src/@core/utils/hex-to-rgba' // Adjust import path as needed

// Create a styled Chip component
const StyledChip = styled(MuiChip)(({ theme, color, variant, rounded, label }) => {
  return {
    ...(color &&
      variant === 'outlined' && {
        border: 'none', // Remove the default border
        color: theme.palette[color].main,
        backgroundColor: hexToRGBA(theme.palette[color].main, 0.12),
        '&:hover': {
          backgroundColor: hexToRGBA(theme.palette[color].main, 0.2),
          cursor: 'pointer'
        }
      }),
    ...(color &&
      variant === 'filled' && {
        color: theme.palette[color].contrastText,
        backgroundColor: theme.palette[color].main,
        '&:hover': {
          backgroundColor: theme.palette[color].dark,
          cursor: 'pointer'
        }
      }),
    ...(rounded && {
      borderRadius: '999px'
    }),
    ...(!label && {
      '& .MuiChip-label': {
        paddingLeft: '0px'
      }
    }),
    ...(!label && {
      '& .MuiChip-icon': {
        marginRight: '-7.5px'
      }
    })
  }
})

const Chip = forwardRef((props, ref) => {
  // Destructure and set defaults
  const { color = 'primary', variant = 'outlined', rounded = false, ...rest } = props

  return (
    <StyledChip
      ref={ref}
      color={color}
      variant={variant}
      rounded={rounded}
      {...rest}
    />
  )
})

export default Chip
