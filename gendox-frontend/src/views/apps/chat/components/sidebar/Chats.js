import { useEffect, useState } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Icon from "src/@core/components/icon";
import toast from "react-hot-toast";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { ScrollWrapper } from "src/utils/chatSidebarUtils";
import { sortByField } from "src/utils/orderUtils";
import { groupChatsByDate } from "src/utils/chatSidebarUtils";
import chatThreadService from "src/gendox-sdk/chatThreadService";
import { fetchChatsContacts } from "src/store/apps/chat";
import authConfig from "src/configs/auth";
import DeleteConfirmDialog from "src/utils/dialogs/DeleteConfirmDialog";
import { getErrorMessage } from "src/utils/errorHandler";
import ChatRenameDialog from "src/views/apps/chat/components/sidebar/ChatRenameDialog";

const Chats = ({
  store,
  activeChat,
  setActiveChat,
  hidden,
  handleChatClick,
}) => {
  const router = useRouter();
  const { organizationId } = router.query;
  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );
  const dispatch = useDispatch();
  const [hoveredChat, setHoveredChat] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleChatMouseLeave = () => {
    setHoveredChat(null);
  };
  const handleChatMouseEnter = (chatId) => {
    setHoveredChat(chatId);
  };
  const handleMenuClick = (event, chatId) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setActiveChat({ type: "chat", id: chatId });
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const openRenameDialog = () => {
    setNewName(""); // Reset input field
    setRenameDialogOpen(true);
    handleMenuClose();
  };

  const closeRenameDialog = () => {
    setRenameDialogOpen(false);
  };

  const handleRename = async () => {
    if (!newName.trim()) {
      toast.error("Name cannot be empty");
      closeRenameDialog();
      return;
    }

    const updatedChatThreadPayload = {
      name: newName,
    };

    try {
      await chatThreadService.updateChatThread(
        organizationId,
        activeChat.id,
        updatedChatThreadPayload,
        storedToken
      );
      dispatch(fetchChatsContacts({ organizationId, storedToken }));
      console.log("Chat thread renamed to", newName);
    } catch (error) {
      toast.error(
        `Failed to rename Chat Thread. Error: ${getErrorMessage(error)}`
      );
      console.error("Error renaming chat thread", error);
    }

    closeRenameDialog();
  };

  const handleDeleteConfirmOpen = () => {
    handleMenuClose();
    setConfirmDelete(true);
  };

  const handleDeleteConfirmClose = () => {
    setConfirmDelete(false);
  };

  const handleDelete = async () => {
    try {
      await chatThreadService.deleteChatThread(
        organizationId,
        activeChat.id,
        storedToken
      );
      dispatch(fetchChatsContacts({ organizationId, storedToken }));
      console.log("Chat thread deleted");
    } catch (error) {
      toast.error(
        `Failed to Delete Chat Thread. Error: ${getErrorMessage(error)}`
      );
      console.error("Error deleting chat thread", error);
    }
    setConfirmDelete(false);
    handleMenuClose();
  };

  const renderChats = () => {
    if (store && store.chats && store.chats.length) {
      const arrToMap = store.chats;

      const groupedChats = groupChatsByDate(arrToMap);

      const renderGroupedChats = (chats, label) => (
        <>
          {chats.length > 0 && (
            <Typography
              variant="subtitle2"
              sx={{ px: 3, pt: 3, pb: 1, color: "primary.main" }}
            >
              {label}
            </Typography>
          )}
          {chats.map((chat, index) => {
            const { lastMessage } = chat.chat;
            const activeCondition =
              activeChat !== null &&
              activeChat.id === chat.id &&
              activeChat.type === "chat";
            const formattedTime = lastMessage
              ? formatDistanceToNow(parseISO(lastMessage.time), {
                  addSuffix: true,
                })
              : "Time unknown";

            return (
              <ListItem
                key={index}
                disablePadding
                onMouseEnter={() => handleChatMouseEnter(chat.id)}
                onMouseLeave={handleChatMouseLeave}
                sx={{ "&:not(:last-child)": { mb: 1.5 }, position: "relative" }}
              >
                <ListItemButton
                  disableRipple
                  onClick={() =>
                    handleChatClick("chat", chat.id, chat.projectId)
                  }
                  sx={{
                    px: 2.5,
                    py: 2.5,
                    width: "100%",
                    borderRadius: 1,
                    alignItems: "flex-start",
                    height: 72,
                    ...(activeCondition && {
                      backgroundColor: (theme) =>
                        `${theme.palette.primary.main} !important`,
                    }),
                  }}
                >
                  <ListItemText
                    sx={{
                      my: 0,
                      ml: 4,
                      mr: 1.5,
                      "& .MuiTypography-root": {
                        ...(activeCondition && { color: "common.white" }),
                      },
                    }}
                    primary={
                      <Typography
                        noWrap
                        sx={{
                          ...(!activeCondition
                            ? { color: "text.secondary" }
                            : {}),
                        }}
                      >
                        {chat.fullName}
                      </Typography>
                    }
                    secondary={
                      <Typography
                        noWrap
                        variant="body2"
                        sx={{
                          ...(!activeCondition && { color: "text.disabled" }),
                        }}
                      >
                        {/* {lastMessage ? lastMessage.message : null} */}
                        {chat.threadName === "Chat Thread"
                          ? "Unnamed Chat"
                          : chat.threadName}
                      </Typography>
                    }
                  />
                  {storedToken && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-end",
                        flexDirection: "column",
                        justifyContent: "flex-start",
                      }}
                    >
                      <IconButton
                        className="chat-actions"
                        onClick={(e) => handleMenuClick(e, chat.id)}
                        sx={{
                          visibility:
                            hoveredChat === chat.id ? "visible" : "hidden",
                        }}
                      >
                        <Icon icon="mdi:dots-horizontal" />
                      </IconButton>
                    </Box>
                  )}
                  
                </ListItemButton>
              </ListItem>
            );
          })}
        </>
      );
      return (
        <>
          {renderGroupedChats(groupedChats.today, "Today")}
          {renderGroupedChats(groupedChats.yesterday, "Yesterday")}
          {renderGroupedChats(groupedChats.last7Days, "Last 7 Days")}
          {renderGroupedChats(groupedChats.last30Days, "Last 30 Days")}
          {renderGroupedChats(groupedChats.older, "Older")}
        </>
      );
    }
  };

  return (
    <>
      <Box sx={{ flexGrow: 1, minHeight: 0 }}>
        <Typography
          variant="h6"
          sx={{ px: 3, pt: 3, pb: 2, color: "primary.main" }}
        >
          Chats
        </Typography>
        <ScrollWrapper hidden={hidden}>
          <List sx={{ px: 3, pb: 3, maxHeight: "45vh" }}>{renderChats()}</List>
        </ScrollWrapper>
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem onClick={openRenameDialog}>Rename</MenuItem>
        <MenuItem onClick={handleDeleteConfirmOpen}>Delete</MenuItem>
      </Menu>

      <ChatRenameDialog
        open={renameDialogOpen}
        onClose={closeRenameDialog}
        onRename={handleRename}
        newName={newName}
        setNewName={setNewName}
      />

      <DeleteConfirmDialog
        open={confirmDelete}
        onClose={handleDeleteConfirmClose}
        onConfirm={handleDelete}
        title="Confirm Deletion Chat"
        contentText={`Are you sure you want to delete the chat thread? This action cannot be undone.`}
        confirmButtonText="Remove Chat"
        cancelButtonText="Cancel"
      />
    </>
  );
};

export default Chats;
