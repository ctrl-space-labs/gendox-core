import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from "next/router";
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Icon from 'src/@core/components/icon'

import UploaderDocument from 'src/views/gendox-components/home-page-components/project-buttons-components/UploaderDocument'


const ProjectButtons = () => {
  const project = useSelector((state) => state.activeProject.projectDetails);
  const router = useRouter();
  const [showUploader, setShowUploader] = useState(false);
  const handleOpenUploader = () => setShowUploader(true);
  const handleCloseUploader = () => setShowUploader(false);

  const handleCreateDocument = () => {
    router.push(`/gendox/create-document?organizationId=${project.organizationId}&projectId=${project.id}`);
  }

  const buttons = [
    { text: "NEW DOCUMENT" , action: handleCreateDocument},
    { text: "UPLOAD DOCUMENT", action: handleOpenUploader },
    { text: "NEW TEMPLATE" },
    { text: "UPLOAD TEMPLATE" }
  ];


  return (
    
    <Grid container spacing={6}>     
      <CardContent>     
        <Grid container spacing={2}>
        {buttons.map((button, index) => (
            <Grid item key={index}>              
              <Button variant='outlined' color='primary' onClick={button.action}>
              <Icon icon='mdi:plus' />
              {button.text}
              </Button>
            </Grid>
          ))}
        </Grid>
      </CardContent>
      <Modal
        open={showUploader}
        onClose={handleCloseUploader}
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Box sx={{ outline: 'none', p: 2, bgcolor: 'background.paper' }}>
          <UploaderDocument closeUploader={handleCloseUploader} />
        </Box>
      </Modal>
      </Grid>
    
  )
}

export default ProjectButtons
