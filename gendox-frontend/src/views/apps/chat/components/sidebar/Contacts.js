import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Typography from "@mui/material/Typography";
import CustomAvatar from "src/@core/components/mui/avatar";
import { ScrollWrapper } from "src/utils/chatSidebarUtils";
import { sortByField } from "src/utils/orderUtils";

const Contacts = ({
  store,
  activeProjectId,
  hidden,
  handleChatClick,
  statusObj,
  getInitials,
}) => {

  const hasActiveId = (id) => {
    if (store.chats !== null) {
      const arr = store.chats.filter((i) => i.id === id);
      return !!arr.length;
    }
  };

  const renderContacts = () => {
    if (store && store.contacts && store.contacts.length) {
      const selectedContact = store.contacts?.find(
        (contact) => contact.projectId === activeProjectId
      );
      const sortedContacts = sortByField(
        store.contacts,
        "fullName",
        selectedContact?.id
      );

      return sortedContacts !== null
        ? sortedContacts.map((contact, index) => {
            const activeProjectCondition =
              activeProjectId === contact.projectId;

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
                      contact.id,
                      contact.projectId
                    )
                  }
                  sx={{
                    px: 2.5,
                    py: 2.5,
                    width: "100%",
                    borderRadius: 1,
                    height: 72,
                    ...(activeProjectCondition && {
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
                                !activeProjectCondition
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
                          skin={
                            activeProjectCondition ? "light-static" : "light"
                          }
                          sx={{
                            width: 40,
                            height: 40,
                            fontSize: "1rem",
                            outline: (theme) =>
                              `2px solid ${
                                activeProjectCondition
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
                      ...(activeProjectCondition && {
                        "& .MuiTypography-root": { color: "common.white" },
                      }),
                    }}
                    primary={
                      <Typography
                        sx={{
                          ...(!activeProjectCondition
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
                          ...(!activeProjectCondition && {
                            color: "text.disabled",
                          }),
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
  };

  return (
    <Box sx={{ flex: "1 0 auto", minHeight: 0 }}>
      <Typography
        variant="h6"
        sx={{ px: 3, pt: 3, pb: 2, color: "primary.main" }}
      >
        Agents
      </Typography>
      <ScrollWrapper hidden={hidden}>
        <List sx={{ px: 3, pb: 3, maxHeight: "25vh" }}>{renderContacts()}</List>
      </ScrollWrapper>
    </Box>
  );
};

export default Contacts;
