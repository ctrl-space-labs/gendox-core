import React, { forwardRef } from "react";
import { useSelector } from "react-redux";
// ** MUI Imports
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import GendoxMarkdownRenderer from "../markdown-renderer/GendoxMarkdownRenderer";

const SectionCard = forwardRef((props, ref) => {
  const { targetIndex, highlightedSectionId } = props;
  const sections = useSelector((state) => state.activeDocument.sections);

  if (!sections || sections.length === 0) {
    return <Typography sx={{ padding: 2 }}>No sections available</Typography>;
  }

  return (
    <Card sx={{ backgroundColor: "transparent", boxShadow: "none" }}>
      {sections.map((section, index) => (
        <React.Fragment key={section.id || index}>
          <CardContent
            ref={index === targetIndex ? ref : null}
            sx={{
              overflow: "auto",
              backgroundColor:
                section.id === highlightedSectionId
                  ? "action.selected"
                  : "transparent",
            }}
          >
            <Typography
              variant="h6"
              sx={{ mb: 2, textAlign: "left", color: "primary.main" }}
            >
              {section.documentSectionMetadata.title === "Default Title"
                ? ""
                : section.documentSectionMetadata.title}
            </Typography>
            
            <GendoxMarkdownRenderer markdownText={section.sectionValue} />
          </CardContent>
          {index !== sections.length - 1 && (
            <Divider
              sx={{
                my: 3, 
                mx: 4, 
                width: "calc(100% - 32px)", 
                borderWidth: "2px", 
                borderColor: "primary.light", 
              }}
            />
          )}
        </React.Fragment>
      ))}
    </Card>
  );
});

export default SectionCard;
