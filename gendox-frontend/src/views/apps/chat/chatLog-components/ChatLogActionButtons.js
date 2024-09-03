import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Icon from "src/@core/components/icon";




const ChatLogActionButtons = ({ showInfo, setShowInfo }) => {

// ** Handle copy action
const handleCopy = () => {
    console.log("Copy action triggered");
    // Implement your copy logic here
  };

  // ** Handle regenerate action
  const handleRegenerate = () => {
    console.log("Regenerate action triggered");
    // Implement your regenerate logic here
  };

  // ** Handle like action
  const handleLike = () => {
    console.log("Like action triggered");
    // Implement your like logic here
  };

  // ** Handle dislike action
  const handleDislike = () => {
    console.log("Dislike action triggered");
    // Implement your dislike logic here
  };

  // ** Handle info action
  const handleInfoToggle = () => {
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
      <IconButton onClick={handleCopy} size="small">
        <Icon icon="mdi:content-copy" />
      </IconButton>
    </Tooltip>
    <Tooltip title="Regenerate">
      <IconButton onClick={handleRegenerate} size="small">
        <Icon icon="mdi:replay" />
      </IconButton>
    </Tooltip>
    <Tooltip title="Like">
      <IconButton onClick={handleLike} size="small">
        <Icon icon="mdi:thumb-up" />
      </IconButton>
    </Tooltip>
    <Tooltip title="Dislike">
      <IconButton onClick={handleDislike} size="small">
        <Icon icon="mdi:thumb-down" />
      </IconButton>
    </Tooltip>
    <Tooltip title="Info">
      <IconButton onClick={handleInfoToggle} size="small">
        <Icon icon="mdi:information-outline" />
      </IconButton>
    </Tooltip>
    </Box>
    );
}

export default ChatLogActionButtons;
