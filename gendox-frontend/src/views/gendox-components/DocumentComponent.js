// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import { styled, useTheme } from '@mui/material/styles'

// Styled Grid component
const StyledGrid = styled(Grid)(({ theme }) => ({
  [theme.breakpoints.down('sm')]: {
    order: -1,
    display: 'flex',
    justifyContent: 'center'
  }
}))

// Styled component for the image
const Img = styled('img')(({ theme }) => ({
  right: 0,
  bottom: 0,
  width: 298,
  position: 'absolute',
  [theme.breakpoints.down('sm')]: {
    width: 250,
    position: 'static'
  }
}))

const DocumentComponent = props => {
  // ** Hook
  const theme = useTheme()

  return (
    <Card sx={{ position: 'relative' }}>
      <CardContent sx={{ p: theme => `${theme.spacing(6.75, 7.5)} !important` }}>
        <Grid container spacing={12} display="flex" justifyContent="center" alignItems="center">
          <Grid item xs={12} sm={12} >
            <Typography variant='h5' sx={{ mb: 4.5 }}>
              {/* Document: {' '} */}
              <Box component='span' sx={{ fontWeight: 'bold' }}>
                {
                  props.document.remoteUrl &&
                    props.document.remoteUrl
                      .split('\\') // Split the string by backslash
                      .pop() // Get the last element from the resulting array
                      .split('_') // Split the string by underscore
                      .slice(1) // Exclude the first part before the first underscore
                      .join('_') // Join the remaining parts with underscore
                }
              </Box>
              ! 🎉
            </Typography>
            <Typography variant='body2' sx={{ mb: 4.5 }}>
              id:{' '}
              <Box component='span' sx={{ fontWeight: 600 }}>
                {props.document.id}
              </Box>{' '}
            </Typography>

            </Grid>
            <Grid>
            <Button variant='contained' loadingPosition='center'>View Sections</Button>
            </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default DocumentComponent
