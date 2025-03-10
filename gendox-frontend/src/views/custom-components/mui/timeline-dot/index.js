'use client'

// React Imports
import { forwardRef } from 'react'

// MUI Imports
import { styled, lighten } from '@mui/material/styles'
import MuiTimelineDot from '@mui/lab/TimelineDot'

// Util Import
import { hexToRGBA } from 'src/@core/utils/hex-to-rgba'

// Create a styled TimelineDot
const StyledTimelineDot = styled(MuiTimelineDot)(
  ({ theme, color, skin, variant }) => ({
    ...(color &&
      skin === 'light' &&
      variant === 'filled' && {
        color: theme.palette[color].main,
        backgroundColor: hexToRGBA(theme.palette[color].main, 0.12)
      }),
    ...(color &&
      skin === 'light-static' &&
      variant === 'filled' && {
        backgroundColor: lighten(theme.palette[color].main, 0.84),
        color: theme.palette[color].main
      }),
    ...(color &&
      skin === 'filled' && {
        color: theme.palette[color].contrastText,
        backgroundColor: theme.palette[color].main
      })
  })
)

const CustomTimelineDot = forwardRef((props, ref) => {
  // Set default props to match your original component
  const {
    color = 'grey',
    skin = 'light',
    variant = 'filled',
    ...rest
  } = props

  return (
    <StyledTimelineDot
      ref={ref}
      color={color}
      skin={skin}
      variant={variant}
      {...rest}
    />
  )
})

export default CustomTimelineDot
