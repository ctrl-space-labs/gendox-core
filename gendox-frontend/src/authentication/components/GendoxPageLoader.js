import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

const GendoxPageLoader = ({ sx }) => {

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
      <CircularProgress  sx={{mt: 6}}/>
    </Box>
  )
}

export default GendoxPageLoader
