import React, { Fragment, useState} from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import Button from "@mui/material/Button";
import ListItem from "@mui/material/ListItem";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import Icon from "src/@core/components/icon";
import { useDropzone } from "react-dropzone";
import authConfig from "src/configs/auth";
import documentService from "src/gendox-sdk/documentService";

const HeadingTypography = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(5),
  [theme.breakpoints.down("sm")]: {
    marginBottom: theme.spacing(4),
  },
}));

const UploaderDocument = ({ closeUploader }) => {
  const [files, setFiles] = useState([]);
  const router = useRouter();
  
  const { organizationId, projectId } = router.query;
  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop: (acceptedFiles) => {
      setFiles((prevFiles) => [
        ...prevFiles,
        ...acceptedFiles.map((file) => Object.assign(file)),
      ]);
    },
   
  });

  const uploadFiles = async () => {
    const formData = new FormData();
    files.forEach((file) => formData.append("file", file));

    try {
      const response = await documentService.uploadDocument(
        organizationId,
        projectId,
        formData,
        storedToken
      );
      console.log("Upload successful", response.data);
      setFiles([]);
      closeUploader();
    } catch (error) {
      console.error("Error uploading files", error);
    }
  };

  const renderFilePreview = (file) => {
    if (file.type.startsWith("image")) {
      return (
        <img
          width={38}
          height={38}
          alt={file.name}
          src={URL.createObjectURL(file)}
        />
      );
    } else {
      return <Icon icon="mdi:file-document-outline" />;
    }
  };

  

  const handleRemoveFile = (fileName) => {
    // Filter out the file based on its name
    const filteredFiles = files.filter(file => file.name !== fileName);
    setFiles(filteredFiles);
  };
  

  const handleRemoveAllFiles = () => {
    setFiles([]);
  };

  

  const fileList = files.map((file) => (
    <ListItem key={file.name}>
      <div className="file-details">
        <div className="file-preview">{renderFilePreview(file)}</div>
        <div>
          <Typography className="file-name">{file.name}</Typography>
          <Typography className="file-size" variant="body2">
            {Math.round(file.size / 1024) > 1000
              ? `${Math.round(file.size / 1024 / 1024).toFixed(1)} MB`
              : `${Math.round(file.size / 1024).toFixed(1)} KB`}
          </Typography>
        </div>
      </div>
      <IconButton onClick={() => handleRemoveFile(file.name)}>
        <Icon icon="mdi:close" fontSize={20} />
      </IconButton>
    </ListItem>
  ));

  return (
    <Box
      sx={{
        padding: "18px 24px",
        borderRadius: "8px",
        margin: "5px auto",
        width: "100%",
        height: "100%",
        backgroundColor: "background.paper",
        position: "relative",
        minWidth: "574px",
        minHeight: "351px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 2,
        }}
      >
        <Typography variant="h6">Upload Document</Typography>
        <IconButton sx={{ color: "primary.main" }} onClick={closeUploader}>
          <Icon icon="mdi:close" />
        </IconButton>
      </Box>
      <Box
        {...getRootProps({ className: "dropzone" })}
        sx={{
          height: "100%",
          width: "100%",
          minHeight: "158px",
          minWidth: "550px",
          padding: "12px",
          border: "2px dashed",
          borderColor: "primary.main",
          borderRadius: "8px",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(234, 234, 255, 0.06)",
          marginBottom: 2,
        }}
      >
        <input {...getInputProps()} />

        <Box sx={{ color: "primary.main", mb: 2 }}>
          <Icon width={200} icon="mdi:cloud-upload" />
        </Box>

        <HeadingTypography variant="h5">Drag and Drop</HeadingTypography>
        <Typography
          variant="h5"
          color="textSecondary"
          sx={{
            mb: 2,
            "& a": { color: "primary.main", textDecoration: "none" },
          }}
        >
          or{" "}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center", // This will center the button
          width: "100%", // Ensures the flex container spans the full width
          mt: 6,
          mb: 4,
        }}
      >
        <Button
          variant="contained"
          onClick={() => open()}
          sx={{
            backgroundColor: "primary.main",
            "&:hover": {
              backgroundColor: "primary.light",
            },
          }}
        >
          CHOOSE FILES
        </Button>
      </Box>

      <Typography
        sx={{
          mt: 2,
          color: "text.secondary",
          textAlign: "center",
          fontSize: "0.8rem",
        }}
      >
        Maximum file size 100MB
      </Typography>

      {files.length ? (
        <Fragment>
          <List>{fileList}</List>
          <Box
            sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 2 }}
          >
            <Button
              color="error"
              variant="outlined"
              onClick={handleRemoveAllFiles}
            >
              Remove All
            </Button>
            <Button variant="contained" onClick={uploadFiles}>
              Upload Files
            </Button>
          </Box>
        </Fragment>
      ) : null}
    </Box>

    // <Box {...getRootProps()} sx={{
    //   border: '2px dashed gray',
    //   padding: 4,
    //   cursor: 'pointer',
    //   width: '80%', // Adjust width as needed
    //   height: '300px', // Adjust height as needed
    //   display: 'flex',
    //   flexDirection: 'column',
    //   alignItems: 'center',
    //   justifyContent: 'center', // Centers the content vertically
    //   margin: 'auto', // Centers the box in its container horizontally
    //   borderRadius: '10px', // Optional: adds rounded corners for better aesthetics
    //   backgroundColor: '#f0f0f0', // Optional: adds a background color
    //   '&:hover': {
    //     backgroundColor: '#e9e9e9', // Optional: changes background on hover for a nice effect
    //   },
    // }}>
    //   <input {...getInputProps()} />
    //   <p>Drag 'n' drop some files here, or click to select files .txt,.md,.rst,.pdf</p>
    //   {files.length > 0 && (
    //     <Box sx={{ mt: 2, width: '100%', maxHeight: '200px', overflowY: 'auto' }}>
    //     <List>
    //       {files.map(file => (
    //         <ListItem key={file.path}>
    //           {file.name} - {file.size} bytes
    //         </ListItem>
    //       ))}
    //     </List>
    //     </Box>
    //   )}
    //   <Button variant="contained" color="primary" onClick={uploadFiles} sx={{ mt: 2 }}>
    //     Upload Files
    //   </Button>
    // </Box>
  );
};

export default UploaderDocument;
