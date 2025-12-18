import GlobalStyles from '@mui/material/GlobalStyles'
import { useTheme } from '@mui/material/styles'

const GlobalScrollbar = () => {
  const theme = useTheme()

  return (
    <GlobalStyles
      styles={{
        '*': {
          // Firefox
          scrollbarWidth: 'thin',
          scrollbarColor: `${
            theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
          } transparent`,

          // Chrome, Edge, Safari
          '&::-webkit-scrollbar': {
            width: '8px', 
            height: '8px' 
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent' 
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
            borderRadius: '20px', 
            border: '2px solid transparent',
            backgroundClip: 'content-box'
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: theme.palette.primary.main
          },
          '&::-webkit-scrollbar-corner': {
            background: 'transparent'
          }
        }
      }}
    />
  )
}

export default GlobalScrollbar