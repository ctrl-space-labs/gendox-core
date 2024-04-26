import React, { useState } from 'react';
// ** MUI Imports
import Card from "@mui/material/Card";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";

const SectionCard = ({ section }) => {
  const [showFullText, setShowFullText] = useState(false);

  const toggleReadMore = () => {
    setShowFullText(!showFullText);
  };

  // Split the sectionValue into an array of words
  const wordsArray = section.sectionValue.split(" ");

    // Determine the text to display based on showFullText state
  const displayText = showFullText
    ? section.sectionValue
    : wordsArray.slice(0, 20).join(" ");

  return (
    <Card>
      <CardContent sx={{ overflow: 'auto' }}>
        <Typography variant="h6" sx={{ mb: 2, textAlign: "center" }}>
          Section: {section.documentSectionMetadata.sectionOrder}. <br />
          {wordsArray.slice(0, 4).join(" ")}
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {displayText}
        </Typography>
      </CardContent>
      <CardActions sx={{ justifyContent: 'center' }}>
        {showFullText ? (
          <Button onClick={toggleReadMore}>Read Less</Button>
        ) : (
          <Button onClick={toggleReadMore}>Read More</Button>
        )}
      </CardActions>
    </Card>
  );
};

export default SectionCard;
