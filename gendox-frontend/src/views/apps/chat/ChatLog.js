// ** React Imports
import { useRef, useEffect } from "react";

import { formatDistanceToNow, parseISO } from "date-fns";

import { useDispatch } from "react-redux";

// ** MUI Imports
import Box from "@mui/material/Box";
import { styled } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import { useRouter } from "next/router";


// ** Icon Imports
import Icon from "src/@core/components/icon";

// ** Third Party Components
import PerfectScrollbarComponent from "react-perfect-scrollbar";

// ** Custom Components Imports
import CustomAvatar from "src/@core/components/mui/avatar";

// ** Utils Imports
import { getInitials } from "src/@core/utils/get-initials";
import GendoxMarkdownRenderer from "../../gendox-components/markdown-renderer/GendoxMarkdownRenderer";

const PerfectScrollbar = styled(PerfectScrollbarComponent)(({ theme }) => ({
  padding: theme.spacing(5),
}));

const ChatLog = (props) => {
  // ** Props
  const { data, hidden } = props;
  const projectId = data.contact.projectId;
  

  console.log("PROPS", props);
  // ** Ref
  const chatArea = useRef(null);

  // ** Scroll to chat bottom
  const scrollToBottom = () => {
    if (chatArea.current) {
      if (hidden) {
        // @ts-ignore
        chatArea.current.scrollTop = chatArea.current.scrollHeight;
      } else {
        // @ts-ignore
        chatArea.current._container.scrollTop =
          chatArea.current._container.scrollHeight;
      }
    }
  };

  // ** Formats chat data based on sender
  const formattedChatData = () => {
    let chatLog = [];
    if (data.chat) {
      chatLog = data.chat.chat;
    }
    const formattedChatLog = [];
    let chatMessageSenderId = chatLog[0] ? chatLog[0].senderId : 11;

    let msgGroup = {
      senderId: chatMessageSenderId,
      messages: [],
    };
    chatLog.forEach((msg, index) => {
      if (chatMessageSenderId === msg.senderId) {
        msgGroup.messages.push({
          time: msg.time,
          msg: msg.message,
          sections: msg.sections,
          feedback: msg.feedback,
        });
      } else {
        chatMessageSenderId = msg.senderId;
        formattedChatLog.push(msgGroup);
        msgGroup = {
          senderId: msg.senderId,
          messages: [
            {
              time: msg.time,
              msg: msg.message,
              sections: msg.sections,
              feedback: msg.feedback,
            },
          ],
        };
      }
      if (index === chatLog.length - 1) formattedChatLog.push(msgGroup);
    });

    return formattedChatLog;
  };

  const renderMsgFeedback = (isSender, feedback) => {
    if (isSender) {
      if (feedback.isSent && !feedback.isDelivered) {
        return (
          <Box
            component="span"
            sx={{
              display: "inline-flex",
              "& svg": { mr: 2, color: "text.secondary" },
            }}
          >
            <Icon icon="mdi:check" fontSize="1rem" />
          </Box>
        );
      } else if (feedback.isSent && feedback.isDelivered) {
        return (
          <Box
            component="span"
            sx={{
              display: "inline-flex",
              "& svg": {
                mr: 2,
                color: feedback.isSeen ? "success.main" : "text.secondary",
              },
            }}
          >
            <Icon icon="mdi:check-all" fontSize="1rem" />
          </Box>
        );
      } else {
        return null;
      }
    }
  };

  

  useEffect(() => {
    if (data && data.chat && data.chat.chat.length) {
      scrollToBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // ** Renders user chat
  const renderChats = () => {
    return formattedChatData().map((item, index) => {
      const isSender = item.senderId === data.userContact.id;
      return (
        <Box
          key={index}
          sx={{
            display: "flex",
            flexDirection: !isSender ? "row" : "row-reverse",
            mb: index !== formattedChatData().length - 1 ? 9.75 : undefined,
          }}
        >
          <div>
            <CustomAvatar
              skin="light"
              color={
                data.contact.avatarColor ? data.contact.avatarColor : undefined
              }
              sx={{
                width: "2rem",
                height: "2rem",
                fontSize: "0.875rem",
                ml: isSender ? 4 : undefined,
                mr: !isSender ? 4 : undefined,
              }}
              // src="/images/gendoxLogo.svg"
              // alt="Gendox Logo"
              {...(data.contact.avatar && !isSender
                ? {
                    src: data.contact.avatar,
                    alt: data.contact.fullName,
                  }
                : {})}
              {...(isSender
                ? {
                    src: data.userContact.avatar,
                    alt: data.userContact.fullName,
                  }
                : {})}
            >
              {data.contact.avatarColor
                ? getInitials(data.contact.fullName)
                : null}
            </CustomAvatar>
          </div>

          <Box
            className="chat-body"
            sx={{ maxWidth: ["calc(100% - 5.75rem)", "75%", "65%"] }}
          >
            {item.messages.map((chat, index, { length }) => {
              // const time = new Date(chat.time);
              const formattedTime = formatDistanceToNow(parseISO(chat.time), {
                addSuffix: true,
              });

              return (
                <Box key={index} sx={{ "&:not(:last-of-type)": { mb: 3.5 } }}>
                  <div>
                    <Typography
                      sx={{
                        boxShadow: 1,
                        borderRadius: 1,
                        maxWidth: "100%",
                        width: "fit-content",
                        fontSize: "0.875rem",
                        wordWrap: "break-word",
                        p: (theme) => theme.spacing(3, 4),
                        ml: isSender ? "auto" : undefined,
                        borderTopLeftRadius: !isSender ? 0 : undefined,
                        borderTopRightRadius: isSender ? 0 : undefined,
                        color: isSender ? "common.white" : "text.primary",
                        backgroundColor: isSender
                          ? "primary.main"
                          : "background.paper",
                      }}
                    >
                      {/*{chat.msg}*/}
                      <GendoxMarkdownRenderer markdownText={chat.msg} />
                    </Typography>
                    {chat.sections && chat.sections.length > 0 ? (
                      <Box sx={{ display: "flex", mt: 1 }}>
                        {chat.sections.map((messageSection, idx) => (
                          <Link
                            key={idx}
                            href={`/gendox/document-instance/?documentId=${messageSection.documentId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              ml: { xs: 1, sm: 2, md: idx !== 0 ? 5 : 0 },                              
                              color: isSender ? "common.white" : "primary.main",
                              textDecoration: "none",
                              "&:hover": {
                                textDecoration: "underline",
                                backgroundColor: isSender
                                  ? "primary.dark"
                                  : "secondary.light",
                                color: "common.white",
                              },
                              p: 1,
                              borderRadius: 1,
                              flexGrow: 1, 
                              textAlign: "center",
                            }}
                          >
                            Link-{idx + 1}
                          </Link>
                        ))}
                      </Box>
                    ) : null}
                  </div>
                  {index + 1 === length ? (
                    <Box
                      sx={{
                        mt: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: isSender ? "flex-end" : "flex-start",
                      }}
                    >
                      {renderMsgFeedback(isSender, chat.feedback)}
                      <Typography
                        variant="caption"
                        sx={{ color: "text.disabled" }}
                      >
                        {" "}
                        {formattedTime ? formattedTime : null}
                      </Typography>
                    </Box>
                  ) : null}
                </Box>
              );
            })}
          </Box>
        </Box>
      );
    });
  };

  const ScrollWrapper = ({ children }) => {
    if (hidden) {
      return (
        <Box
          ref={chatArea}
          sx={{ p: 5, height: "100%", overflowY: "auto", overflowX: "hidden" }}
        >
          {children}
        </Box>
      );
    } else {
      return (
        <PerfectScrollbar ref={chatArea} options={{ wheelPropagation: false }}>
          {children}
        </PerfectScrollbar>
      );
    }
  };

  return (
    <Box sx={{ height: "calc(100% - 8.4375rem)" }}>
      <ScrollWrapper>{renderChats()}</ScrollWrapper>
    </Box>
  );
};

export default ChatLog;
