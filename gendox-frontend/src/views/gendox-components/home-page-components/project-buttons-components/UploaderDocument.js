import React, { Fragment, useState } from "react";
import { useRouter } from "next/router";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import Button from "@mui/material/Button";
import ListItem from "@mui/material/ListItem";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
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

const LinearProgressWithLabel = (props) => {
  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Box sx={{ width: "100%", mr: 1 }}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="text.secondary">
          {`${Math.round(props.value)}%`}
        </Typography>
      </Box>
    </Box>
  );
};

const UploaderDocument = ({ closeUploader }) => {
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [alertOpen, setAlertOpen] = useState(false);
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

  const uploadBatch = async (batch) => {
    const uploadPromises = batch.map(async (file) => {
      const formData = new FormData();
      formData.append("file", file);

      try {
        simulateProgress(file);
        await documentService.uploadDocument(
          organizationId,
          projectId,
          formData,
          storedToken
        );
      } catch (error) {
        console.error("Error uploading files", error);
      }
    });

    await Promise.all(uploadPromises);
  };


  const simulateProgress = (file) => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress((prevProgress) => ({
          ...prevProgress,
          [file.id]: { progress, uploading: true },
        }));
        if (progress >= 100) {
          clearInterval(interval);
          setUploadProgress((prevProgress) => ({
            ...prevProgress,
            [file.id]: { progress: 100, uploading: false },
          }));
          resolve();
        }
      }, 500);
    });
  };

  const uploadFiles = async () => {
    const batchSize = 10; // Configurable batch size
    let start = 0;

    while (start < files.length) {
      const batch = files.slice(start, start + batchSize);
      await uploadBatch(batch);
      start += batchSize;
    }

    console.log("All files uploaded successfully");
    setAlertOpen(true);
    setFiles([]);
    closeUploader();

    router.reload(); 
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
    const filteredFiles = files.filter((file) => file.name !== fileName);
    setFiles(filteredFiles);
  };

  const handleRemoveAllFiles = () => {
    setFiles([]);
  };

  const handleCloseAlert = () => {
    setAlertOpen(false);
  };

  const fileList = files.map((file) => (
    <ListItem
      key={file.name}
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 16px",
        borderRadius: "8px",
        marginBottom: "8px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
          <Box sx={{ marginRight: "16px" }}>{renderFilePreview(file)}</Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography className="file-name" sx={{ fontWeight: "500" }}>
              {file.name}
            </Typography>
            <Typography
              className="file-size"
              variant="body2"
              sx={{ color: "text.secondary" }}
            >
              {Math.round(file.size / 1024) > 1000
                ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
                : `${(file.size / 1024).toFixed(1)} KB`}
            </Typography>
          </Box>
          <IconButton
            onClick={() => handleRemoveFile(file.name)}
            sx={{ marginLeft: "16px" }}
          >
            <Icon icon="mdi:delete-outline" fontSize={20} />
          </IconButton>
        </Box>
      </Box>

      {uploadProgress[file.id] && uploadProgress[file.id].uploading && (
        
        <LinearProgressWithLabel value={uploadProgress[file.id].progress} />

      )}
    </ListItem>
  ));

  return (
    <Fragment>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          padding: "12px",
          borderRadius: "8px",
          backgroundColor: "background.paper",
          minWidth: { xs: "300px", sm: "351px", md: "400px", lg: "450px" },
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            padding: "0 5px",
            marginBottom: 2,
          }}
        >
          <Typography variant="h5" sx={{ flexGrow: 1 }}>
            Upload Document
          </Typography>
          <IconButton sx={{ color: "primary.main" }} onClick={closeUploader}>
            <Icon icon="mdi:close" />
          </IconButton>
        </Box>
        <Box
          {...getRootProps({ className: "dropzone" })}
          sx={{
            height: "100%",
            width: "100%",
            minHeight: { xs: "100px", sm: "158px", md: "200px", lg: "250px" }, // minWidth: "550px",
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
            <Box sx={{ maxHeight: "150px", overflowY: "auto" }}>
              <List>{fileList}</List>
            </Box>
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
      <Snackbar
        open={alertOpen}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
      >
        <Alert
          onClose={handleCloseAlert}
          severity="success"
          sx={{ width: "100%" }}
        >
          All files uploaded successfully!
        </Alert>
      </Snackbar>
    </Fragment>
  );
};

export default UploaderDocument;
