import {
  parseISO,
  isToday,
  isYesterday,
  isWithinInterval,
  subDays,
} from "date-fns";
import { Box } from "@mui/material";
import PerfectScrollbar from "react-perfect-scrollbar";

export const groupChatsByDate = (chats) => {
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

export const ScrollWrapper = ({ children, hidden }) => {
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
