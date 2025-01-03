import React, { useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Icon from "src/@core/components/icon";
import { copyToClipboard } from "src/utils/copyToClipboard";

const ChatLogActionButtons = ({
  showInfo,
  setShowInfo,
  fetchChatMessageInfo,
  messageToCopy
}) => {
  const [likeActive, setLikeActive] = useState(false);
  const [dislikeActive, setDislikeActive] = useState(false);
  const [copyActive, setCopyActive] = useState(false);

  // ** Handle copy action
  const handleCopy = () => {
    copyToClipboard(messageToCopy); 
    setCopyActive(true);
    setTimeout(() => {
      setCopyActive(false); // Reset after a short delay
    }, 8000); // 2 seconds delay
  };

  // ** Handle regenerate action
  // const handleRegenerate = () => {
  //   console.log("Regenerate action triggered");
  //   // Implement your regenerate logic here
  // };

  // ** Handle like action
  const handleLike = () => {
    setLikeActive(!likeActive);
    if (dislikeActive) {
      setDislikeActive(false);
    }
  };

  // ** Handle dislike action
  const handleDislike = () => {
    setDislikeActive(!dislikeActive);
    if (likeActive) {
      setLikeActive(false);
    }
  };

  // ** Handle info action
  const handleInfoToggle = async () => {
    if (!showInfo) {
      await fetchChatMessageInfo(); // Fetch message info before showing the info
    }
    setShowInfo(!showInfo);
  };

  // ** Render action buttons
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-end",
        mt: 1,
      }}
    >
      <Tooltip title="Copy">
        <IconButton
          onClick={handleCopy}
          size="small"
          sx={{
            color: copyActive ? "green" : "inherit",
          }}
        >
          <Icon icon="mdi:content-copy" />
        </IconButton>
      </Tooltip>
      {/* <Tooltip title="Regenerate">
      <IconButton onClick={handleRegenerate} size="small">
        <Icon icon="mdi:replay" />
      </IconButton>
    </Tooltip> */}
      {/* <Tooltip title="Like">
        <IconButton
          onClick={handleLike}
          size="small"
          sx={{
            color: likeActive ? "red" : "inherit",
          }}
        >
          <Icon icon="mdi:thumb-up" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Dislike">
        <IconButton
          onClick={handleDislike}
          size="small"
          sx={{
            color: dislikeActive ? "blue" : "inherit",
          }}
        >
          <Icon icon="mdi:thumb-down" />
        </IconButton>
      </Tooltip> */}
      <Tooltip title="Info">
        <IconButton onClick={handleInfoToggle} size="small">
          <Icon icon="mdi:information-outline" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default ChatLogActionButtons;
