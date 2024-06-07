// ** MUI Imports
import { useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

const GendoxFallbackSpinner = ({ sx }) => {
  // ** Hook
  const theme = useTheme()

  return (
      <Box
          sx={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
            justifyContent: 'center',
            ...sx
          }}
      >
        <img src="/images/gendoxLogo.svg" alt="Gendox Logo"/>
        <CircularProgress disableShrink sx={{mt: 6}}/>
      </Box>
  )
}

export default GendoxFallbackSpinner
