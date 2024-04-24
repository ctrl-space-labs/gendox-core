import React, { useState } from 'react';
import authConfig from 'src/configs/auth'
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/router';
import { Box, Button, List, ListItem, Typography } from '@mui/material';
import documentService from "src/gendox-sdk/documentService";


const UploaderDocument = ({ closeUploader }) => {
  const [files, setFiles] = useState([]);
  const router = useRouter();
  const { organizationId, projectId } = router.query;
  const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      setFiles(prevFiles => [...prevFiles, ...acceptedFiles.map(file => Object.assign(file))]);
    }
  });

  const uploadFiles = async () => {
    const formData = new FormData();
    files.forEach(file => formData.append('file', file));
  

  try {
    const response = await documentService.uploadDocument(organizationId, projectId, formData ,storedToken)
    console.log('Upload successful', response.data);
    setFiles([]);
    closeUploader(); 
  } catch (error) {
    console.error('Error uploading files', error);
  }
};
  


return (
  <Box {...getRootProps()} sx={{
    border: '2px dashed gray',
    padding: 4,
    cursor: 'pointer',
    width: '80%', // Adjust width as needed
    height: '300px', // Adjust height as needed
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center', // Centers the content vertically
    margin: 'auto', // Centers the box in its container horizontally
    borderRadius: '10px', // Optional: adds rounded corners for better aesthetics
    backgroundColor: '#f0f0f0', // Optional: adds a background color
    '&:hover': {
      backgroundColor: '#e9e9e9', // Optional: changes background on hover for a nice effect
    },
  }}>
    <input {...getInputProps()} />
    <p>Drag 'n' drop some files here, or click to select files .txt,.md,.rst,.pdf</p>
    {files.length > 0 && (
      <Box sx={{ mt: 2, width: '100%', maxHeight: '200px', overflowY: 'auto' }}>
      <List>
        {files.map(file => (
          <ListItem key={file.path}>
            {file.name} - {file.size} bytes
          </ListItem>
        ))}
      </List>
      </Box>
    )}
    <Button variant="contained" color="primary" onClick={uploadFiles} sx={{ mt: 2 }}>
      Upload Files
    </Button>
  </Box>
);
};

export default UploaderDocument
