import React, { useState } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'

import ButtonComponent from 'src/views/gendox-components/project-buttons-components/ButtonComponent'
import UploaderDocument from 'src/views/gendox-components/project-buttons-components/UploaderDocument'


const ProjectButtons = props => {
  const [showUploader, setShowUploader] = useState(false);
  const handleOpenUploader = () => setShowUploader(true);
  const handleCloseUploader = () => setShowUploader(false);

  const buttons = [
    { text: "NEW DOCUMENT" },
    { text: "UPLOAD DOCUMENT", action: handleOpenUploader },
    { text: "NEW TEMPLATE" },
    { text: "UPLOAD TEMPLATE" }
  ];


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
        {buttons.map((button, index) => (
            <Grid item key={index}>
              <ButtonComponent text={button.text} onClick={button.action} />
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
    </Card>
  )
}

export default ProjectButtons
