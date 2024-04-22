// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import { styled, useTheme } from '@mui/material/styles'

// ** Next Import
import { useRouter } from 'next/router'

import { useDispatch } from 'react-redux'
import { fetchDocumentById } from "src/store/apps/activeDocument/activeDocument";
import authConfig from 'src/configs/auth'

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

const formatDocumentTitle = (remoteUrl) => {
  if (!remoteUrl) return ''; // Return an empty string if remoteUrl is undefined or null

  // Extract the file name after the last slash
  const fileName = remoteUrl.split('/').pop();

  // Check if the file name contains underscores
  if (fileName.includes('_')) {
    // If it contains underscores, follow the original logic
    return fileName
      .split('_') // Split the string by underscore
      .slice(1) // Exclude the first part before the first underscore
      .join('_'); // Join the remaining parts with underscore
  } else {
    // If there are no underscores, return the file name without extension
    return fileName.split('.').slice(0, -1).join('.'); // Remove the file extension
  }
};



const DocumentComponent = props => {
  // ** Hook
  const theme = useTheme()
  const dispatch = useDispatch();
  const router = useRouter()
  const { organizationId, projectId } = router.query

  const handleNavigation = () => {
    const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)
    dispatch(
      fetchDocumentById({
        organizationId: organizationId,
        projectId: projectId,
        documentId: props.document.id,
        storedToken     
      })
    );
    const path = `/gendox/document-instance?organizationId=${organizationId}&documentId=${props.document.id}`
    router.push(path)
  }

  return (
    <Card sx={{ position: 'relative' }}>
      <CardContent sx={{ p: theme => `${theme.spacing(6.75, 7.5)} !important` }}>
        <Grid container spacing={12} display="flex" justifyContent="center" alignItems="center">
          <Grid item xs={12} sm={12} >
            <Typography variant='h5' sx={{ mb: 4.5 }}>
              {/* Document: {' '} */}
              <Box component='span' sx={{ fontWeight: 'bold' }}>
              {formatDocumentTitle(props.document.remoteUrl)}
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
            <Button variant='contained' onClick={handleNavigation} >View Sections</Button>
            </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default DocumentComponent
