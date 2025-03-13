'use client'

// React Imports
import { forwardRef } from 'react'

// MUI Imports
import MuiBadge from '@mui/material/Badge'
import { styled } from '@mui/material/styles'
import { hexToRGBA } from 'src/@core/utils/hex-to-rgba' // Adjust import path as needed

// Styled version of MUI Badge
const StyledBadge = styled(MuiBadge)(({ theme, skin, color }) => ({
  ...(skin === 'light' &&
    color && {
      '& .MuiBadge-badge': {
        backgroundColor: hexToRGBA(theme.palette[color].main, 0.12),
        color: theme.palette[color].main
      }
    })
}))

const CustomBadge = forwardRef((props, ref) => {
  const { color, skin, ...rest } = props

  return <StyledBadge ref={ref} color={color} skin={skin} {...rest} />
})

export default CustomBadge
