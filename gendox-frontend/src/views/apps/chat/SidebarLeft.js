// ** React Imports
import { useState, useEffect } from "react";

import {
  formatDistanceToNow,
  parseISO,
  isToday,
  isYesterday,
  isWithinInterval,
  subDays,
} from "date-fns";

// ** Next Import
import { useRouter } from "next/router";

// ** Hook Import
import { useAuth } from "src/hooks/useAuth";

// ** MUI Imports
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import Chip from "@mui/material/Chip";
import Badge from "@mui/material/Badge";
import Drawer from "@mui/material/Drawer";
import MuiAvatar from "@mui/material/Avatar";
import ListItem from "@mui/material/ListItem";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemButton from "@mui/material/ListItemButton";
import InputAdornment from "@mui/material/InputAdornment";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

// ** Third Party Components
import PerfectScrollbar from "react-perfect-scrollbar";

// ** Icon Imports
import Icon from "src/@core/components/icon";

// ** Custom Components Import
import CustomAvatar from "src/@core/components/mui/avatar";

// ** Chat App Components Imports
import UserProfileLeft from "src/views/apps/chat/UserProfileLeft";
import authConfig from "src/configs/auth";

const ScrollWrapper = ({ children, hidden }) => {
  if (hidden) {
    return <Box sx={{ height: "100%", overflow: "auto" }}>{children}</Box>;
  } else {
    return (
      <PerfectScrollbar options={{ wheelPropagation: false }}>
        {children}
      </PerfectScrollbar>
    );
  }
};

const SidebarLeft = (props) => {
  // ** Hook
  const auth = useAuth();

  // ** Props
  const {
    store,
    hidden,
    mdAbove,
    dispatch,
    statusObj,
    userStatus,
    selectChat,
    getInitials,
    sidebarWidth,
    setUserStatus,
    leftSidebarOpen,
    removeSelectedChat,
    userProfileLeftOpen,
    formatDateToMonthShort,
    handleLeftSidebarToggle,
    handleUserProfileLeftSidebarToggle,
  } = props;

  const router = useRouter();
  const { organizationId } = router.query;

  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );
  

  // ** States
  const [query, setQuery] = useState("");
  const [filteredChat, setFilteredChat] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [active, setActive] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [hoveredChat, setHoveredChat] = useState(null);

 

  const groupChatsByDate = (chats) => {
    const today = [];
    const yesterday = [];
    const last7Days = [];
    const last30Days = [];
    const older = [];

    chats.forEach((chat) => {
      const chatDate = parseISO(chat.chat.lastMessage.time);

      if (isToday(chatDate)) {
        today.push(chat);
      } else if (isYesterday(chatDate)) {
        yesterday.push(chat);
      } else if (
        isWithinInterval(chatDate, {
          start: subDays(new Date(), 7),
          end: new Date(),
        })
      ) {
        last7Days.push(chat);
      } else if (
        isWithinInterval(chatDate, {
          start: subDays(new Date(), 30),
          end: new Date(),
        })
      ) {
        last30Days.push(chat);
      } else {
        older.push(chat);
      }
    });

    return { today, yesterday, last7Days, last30Days, older };
  };

  const handleChatClick = (type, id) => {
    dispatch(selectChat({ id: id, organizationId, storedToken}));
    setActive({ type, id });
    if (!mdAbove) {
      handleLeftSidebarToggle();
    }
  };
  useEffect(() => {
    if (store && store.chats) {
      if (active !== null) {
        if (
          active.type === "contact" &&
          store?.selectedChat?.contact?.id != null
        ) {
          setActive({ type: "chat", id: store.selectedChat.contact.id });
        }
      }
    }
  }, [store, active]);

  useEffect(() => {
    router.events.on("routeChangeComplete", () => {
      setActive(null);
      dispatch(removeSelectedChat());
    });

    return () => {
      setActive(null);
      dispatch(removeSelectedChat());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasActiveId = (id) => {
    if (store.chats !== null) {
      const arr = store.chats.filter((i) => i.id === id);
      return !!arr.length;
    }
  };

  const handleMenuClick = (event, chatId) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    // setActive({ type: "chat", id: chatId });
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRename = () => {
    // Implement rename functionality here
    handleMenuClose();
  };

  const handleDelete = () => {
    // Implement delete functionality here
    handleMenuClose();
  };

  const handleChatMouseEnter = (chatId) => {
    setHoveredChat(chatId);
  };

  const handleChatMouseLeave = () => {
    setHoveredChat(null);
  };

  const renderChats = () => {
    if (store && store.chats && store.chats.length) {
      if (query.length && !filteredChat.length) {
        return (
          <ListItem>
            <Typography sx={{ color: "text.secondary" }}>
              No Chats Found
            </Typography>
          </ListItem>
        );
      } else {
        const arrToMap =
          query.length && filteredChat.length ? filteredChat : store.chats;

        const groupedChats = groupChatsByDate(arrToMap);

        // return arrToMap.map((chat, index) => {
        //   const { lastMessage } = chat.chat;
        //   const activeCondition =
        //     active !== null && active.id === chat.id && active.type === "chat";
        //   const formattedTime = lastMessage
        //     ? formatDistanceToNow(parseISO(lastMessage.time), {
        //         addSuffix: true,
        //       })
        //     : "Time unknown";

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
                active !== null && active.id === chat.id && active.type === "chat";
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
                onClick={() => handleChatClick("chat", chat.id)}
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
                      {lastMessage ? lastMessage.message : null}
                    </Typography>
                  }
                />
                {/* <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-end",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                  }}
                >
                  <Typography
                    sx={{
                      whiteSpace: "nowrap",
                      color: activeCondition ? "common.white" : "text.disabled",
                    }}
                  >
                    <>
                      {lastMessage
                        ? formatDateToMonthShort(lastMessage.time, true)
                        : new Date()}
                    </>
                  </Typography>                  
                </Box> */}
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
}
};

  const renderContacts = () => {
    if (store && store.contacts && store.contacts.length) {
      if (query.length && !filteredContacts.length) {
        return (
          <ListItem>
            <Typography sx={{ color: "text.secondary" }}>
              No Contacts Found
            </Typography>
          </ListItem>
        );
      } else {
        const arrToMap =
          query.length && filteredContacts.length
            ? filteredContacts
            : store.contacts;

        return arrToMap !== null
          ? arrToMap.map((contact, index) => {
              const activeCondition =
                active !== null &&
                active.id === contact.id &&
                active.type === "contact" &&
                !hasActiveId(contact.id);

              return (
                <ListItem
                  key={index}
                  disablePadding
                  sx={{ "&:not(:last-child)": { mb: 1.5 } }}
                >
                  <ListItemButton
                    disableRipple
                    onClick={() =>
                      handleChatClick(
                        hasActiveId(contact.id) ? "chat" : "contact",
                        contact.id
                      )
                    }
                    sx={{
                      px: 2.5,
                      py: 2.5,
                      width: "100%",
                      borderRadius: 1,
                      height: 72,
                      ...(activeCondition && {
                        backgroundColor: (theme) =>
                          `${theme.palette.primary.main} !important`,
                      }),
                    }}
                  >
                    <ListItemAvatar sx={{ m: 0 }}>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{
                          vertical: "bottom",
                          horizontal: "right",
                        }}
                        badgeContent={
                          <Box
                            component="span"
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              color: `${statusObj[contact.status]}.main`,
                              backgroundColor: `${
                                statusObj[contact.status]
                              }.main`,
                              boxShadow: (theme) =>
                                `0 0 0 2px ${
                                  !activeCondition
                                    ? theme.palette.background.paper
                                    : theme.palette.common.white
                                }`,
                            }}
                          />
                        }
                      >
                        {contact.avatar ? (
                          <MuiAvatar
                            alt={contact.fullName}
                            src={contact.avatar}
                            sx={{
                              width: 40,
                              height: 40,
                              outline: (theme) =>
                                `2px solid ${
                                  activeCondition
                                    ? theme.palette.common.white
                                    : "transparent"
                                }`,
                            }}
                          />
                        ) : (
                          <CustomAvatar
                            color={contact.avatarColor}
                            skin={activeCondition ? "light-static" : "light"}
                            sx={{
                              width: 40,
                              height: 40,
                              fontSize: "1rem",
                              outline: (theme) =>
                                `2px solid ${
                                  activeCondition
                                    ? theme.palette.common.white
                                    : "transparent"
                                }`,
                            }}
                          >
                            {getInitials(contact.fullName)}
                          </CustomAvatar>
                        )}
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      sx={{
                        my: 0,
                        ml: 4,
                        ...(activeCondition && {
                          "& .MuiTypography-root": { color: "common.white" },
                        }),
                      }}
                      primary={
                        <Typography
                          sx={{
                            ...(!activeCondition
                              ? { color: "text.secondary" }
                              : {}),
                          }}
                        >
                          {contact.fullName}
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
                          {contact.about}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              );
            })
          : null;
      }
    }
  };

  return (
    <div>
      <Drawer
        open={leftSidebarOpen}
        onClose={handleLeftSidebarToggle}
        variant={mdAbove ? "permanent" : "temporary"}
        ModalProps={{
          disablePortal: true,
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          zIndex: 7,
          height: "100%",
          display: "block",
          position: mdAbove ? "static" : "absolute",
          "& .MuiDrawer-paper": {
            boxShadow: "none",
            overflow: "hidden",
            width: sidebarWidth,
            position: mdAbove ? "static" : "absolute",
            borderTopLeftRadius: (theme) => theme.shape.borderRadius,
            borderBottomLeftRadius: (theme) => theme.shape.borderRadius,
          },
          "& > .MuiBackdrop-root": {
            borderRadius: 1,
            position: "absolute",
            zIndex: (theme) => theme.zIndex.drawer - 1,
          },
        }}
      >
        <Box
          sx={{
            height: `calc(100% - 4.125rem)`,
            flexDirection: "column",
          }}
        >
          {/* ScrollWrapper for Agents */}

          <Box sx={{ flex: "1 0 auto", minHeight: 0 }}>
            <Typography
              variant="h6"
              sx={{ px: 3, pt: 3, pb: 2, color: "primary.main" }}
            >
              Agents
            </Typography>
            <ScrollWrapper hidden={hidden}>
              <List sx={{ px: 3, pb: 3, maxHeight: "25vh" }}>
                {renderContacts()}
              </List>
            </ScrollWrapper>
          </Box>

          {/* ScrollWrapper for Chats */}

          <Box sx={{ flexGrow: 1, minHeight: 0 }}>
            <Typography
              variant="h6"
              sx={{ px: 3, pt: 3, pb: 2, color: "primary.main" }}
            >
              Chats
            </Typography>
            <ScrollWrapper hidden={hidden}>
              <List sx={{ px: 3, pb: 3, maxHeight: "45vh" }}>
                {renderChats()}
              </List>
            </ScrollWrapper>
          </Box>
        </Box>
      </Drawer>

      <UserProfileLeft
        store={store}
        hidden={hidden}
        statusObj={statusObj}
        userStatus={userStatus}
        sidebarWidth={sidebarWidth}
        setUserStatus={setUserStatus}
        userProfileLeftOpen={userProfileLeftOpen}
        handleUserProfileLeftSidebarToggle={handleUserProfileLeftSidebarToggle}
      />

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
        <MenuItem onClick={handleRename}>Rename</MenuItem>
        <MenuItem onClick={handleDelete}>Delete</MenuItem>
      </Menu>
    </div>
  );
};

export default SidebarLeft;
