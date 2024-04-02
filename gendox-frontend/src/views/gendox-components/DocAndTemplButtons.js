// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// import AddIcon from '@mui/icons-material/Add'

// Styled component for the trophy image
const TrophyImg = styled('img')(({ theme }) => ({
  right: 22,
  bottom: 0,
  width: 106,
  position: 'absolute',
  [theme.breakpoints.down('sm')]: {
    width: 95
  }
}))

const DocAndTemplButtons = props => {
  return (
    <Card sx={{ position: 'relative' }}>
      <CardContent>
        <Typography variant='h6' sx={{ marginBottom: 2 }}>
          Project:{' '}
          <Box component='span' sx={{ fontWeight: 'bold' }}>
            {props.project.name}
          </Box>
        </Typography>

        <Grid container spacing={2}>
          <Grid item>
            <Button
              size='large'
              variant='contained'
              sx={{
                borderRadius: '20px',
                borderColor: '#01989F',
                // color: '#01989F',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: 'transparent',
                  color: '#01989F'
                }
              }}
              startIcon={<Icon icon='mdi:plus' />}
            >
              New Document
            </Button>
          </Grid>

          <Grid item>
            <Button
              size='large'
              variant='contained'
              sx={{
                borderRadius: '20px',
                borderColor: '#01989F',
                // color: '#01989F',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: 'transparent',
                  color: '#01989F'
                }
              }}
              startIcon={<Icon icon='mdi:plus' />}
            >
              Upload Document
            </Button>
          </Grid>
          <Grid item>
            <Button
              size='large'
              variant='contained'
              sx={{
                borderRadius: '20px',
                borderColor: '#01989F',
                // color: '#01989F',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: 'transparent',
                  color: '#01989F'
                }
              }}
              startIcon={<Icon icon='mdi:plus' />}
            >
              New Template
            </Button>
          </Grid>
          <Grid item>
            <Button
              size='large'
              variant='contained'
              sx={{
                borderRadius: '20px',
                borderColor: '#01989F',
                // color: '#01989F',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: 'transparent',
                  color: '#01989F'
                }
              }}
              startIcon={<Icon icon='mdi:plus' />}
            >
              Upload Template
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default DocAndTemplButtons
