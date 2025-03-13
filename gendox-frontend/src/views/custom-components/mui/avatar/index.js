'use client'

// React Imports
import {forwardRef, useMemo} from 'react'

// MUI Imports
import MuiAvatar from '@mui/material/Avatar'
import {lighten, styled, useTheme} from '@mui/material/styles'
import {hexToRGBA} from "../../../../@core/utils/hex-to-rgba";
import {generateIdenticon} from "../../../../utils/identiconUtil";

// Got it from Materio main branch, app router version
const Avatar = styled(MuiAvatar)(({ skin, color, size, theme }) => {

  return {
    ...(color &&
      skin === 'light' && {
        color: theme.palette[color].main,
        backgroundColor: hexToRGBA(theme.palette[color].main, 0.12)
      }),
    ...(color &&
      skin === 'light-static' && {
        backgroundColor: lighten(theme.palette[color].main, 0.84),
        color: theme.palette[color].main
      }),
    ...(color &&
      skin === 'filled' && {
        color: theme.palette[color].contrastText,
        backgroundColor: theme.palette[color].main
      }),
    ...(size && {
      height: size,
      width: size
    })
  }
})

const CustomAvatar = forwardRef((props, ref) => {
  // Props
  const { color, skin = 'filled', identiconValue, src, ...rest } = props
  const theme = useTheme();

  let finalSrc = src
  if (identiconValue && color) {
    const mainColor = theme.palette[color].main
    const bgHex = mainColor
    const bgAlpha = 0.12
    finalSrc = useMemo(() => {
      return generateIdenticon(identiconValue, mainColor, bgHex, Math.round(bgAlpha * 255))
    }, [identiconValue, mainColor, bgHex, bgAlpha])
  }



  return <Avatar color={color} skin={skin} src={finalSrc} ref={ref} {...rest} />
})

export default CustomAvatar
