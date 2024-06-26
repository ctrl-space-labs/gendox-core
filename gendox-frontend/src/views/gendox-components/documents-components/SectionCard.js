import React, { useState } from "react";
import { useSelector } from "react-redux";
// ** MUI Imports
import Card from "@mui/material/Card";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";

const SectionCard = () => {
  const sections = useSelector((state) => state.activeDocument.sections);

  if (!sections || sections.length === 0) {
    return <Typography sx={{ padding: 2 }}>No sections available</Typography>;
  }

  return (
    <Card sx={{ backgroundColor: "transparent", boxShadow: "none" }}>
      {sections.map((section, index) => (
        <React.Fragment key={section.id || index}>
          <CardContent
            sx={{ overflow: "auto", backgroundColor: "transparent" }}
          >
            <Typography
              variant="h6"
              sx={{ mb: 2, textAlign: "left", color: "primary.main" }}
            >
              {section.documentSectionMetadata.title}
            </Typography>
            <TextField
              fullWidth
              variant="standard"
              margin="normal"
              value={section.sectionValue}
              InputProps={{
                readOnly: true,  
                disableUnderline: true  
              }}
              multiline  
            />
            
          </CardContent>
          {index !== sections.length - 1 && (
            <Divider sx={{ my: 2, mx: 3, width: "calc(100% - 24px)" }} />
          )}
        </React.Fragment>
      ))}
    </Card>
  );
};

export default SectionCard;
