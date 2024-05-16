// ** Redux Imports
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import { useAuth } from "src/hooks/useAuth";
import chatConverters from "../../../converters/chat.converter";
import { useRouter } from "next/router";

// ** Axios Imports
import axios from "axios";
import { uid } from "chart.js/helpers";
import apiRequests from "../../../configs/apiRequest";
import authConfig from "src/configs/auth";
import projectService from "src/gendox-sdk/projectService";



// ** Fetch Chats & Contacts
export const fetchChatsContacts = createAsyncThunk(
  "appChat/fetchChatsContacts",
  
  async ( {organizationId, storedToken}, { rejectWithValue }) => {    
    // get all projects for the organization
    
    try {
      
      const projectsByOrgResponse =
        await projectService.getProjectsByOrganization(
          organizationId,
          storedToken,
          
        );

        console.log("1) projectsByOrgResponse", projectsByOrgResponse);

      // Get all threads for the projects
      const threadsResponse = await axios.get(
        apiRequests.getThreadsByCriteria(
          projectsByOrgResponse.data.content.map((project) => project.id)
        ),
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + storedToken,
          },
        }
      );

      console.log("2) threadsResponse", threadsResponse);

      // Use threads data if the request is successful
      const threads = threadsResponse.data.content;
      console.log("3) threads", threads);
      const contacts = projectsByOrgResponse.data.content.map((project) =>
        chatConverters.projectToContact(project)
      );
      console.log("4) contacts", contacts);
      const chatEntries = threads.map((thread) =>
        chatConverters.gendoxThreadToChatEntry(thread, contacts)
      );
      console.log("5) chatEntries", chatEntries);

      chatEntries.sort(
        (a, b) =>
          new Date(b.chat.lastMessage.time) - new Date(a.chat.lastMessage.time)
      );

      return {
        chatsContacts: chatEntries,
        contacts: contacts,
      };
    } catch (error) {
      console.error("Failed to fetch chats and contacts:", error);
      return rejectWithValue(error.message);
    }
  }
);

// ** Select Chat
export const selectChat = createAsyncThunk(
  "appChat/selectChat",
  async (
    { id, keepChatContent = false, organizationId, storedToken },
    { dispatch, getState, rejectWithValue }
  ) => {
    try {
      const state = getState();
      let thread = state.chat.chats.find((thread) => thread.id === id);
      let newThread = !thread;

      if (newThread) {
        return _createNewThreadChat(state, id);
      }

      let selectedChat = await _fetchExistingChatWithMessages(
        id,
        dispatch,
        thread
      );

      dispatch(fetchChatsContacts(organizationId, storedToken));

      return selectedChat;
    } catch (error) {
      console.error("Failed to select chat:", error);
      return rejectWithValue(error.message);
    }
  }
);

// ** Send Msg
export const sendMsg = createAsyncThunk(
  "appChat/sendMsg",
  async (obj, { dispatch, getState, organizationId, rejectWithValue }) => {
  //   const router = useRouter();
  // const { organizationId } = router.query;

  // const storedToken = window.localStorage.getItem(
  //   authConfig.storageTokenKeyName
  // );
    try{
    
    const state = getState();
    let storedToken = window.localStorage.getItem(
      authConfig.storageTokenKeyName
    );

    //chat append string
    dispatch(
      addMessage({
        senderId: state.chat.userProfile.id,
        text: obj.message,
        time: new Date(),
      })
    );

    console.log("sendMsg chat2: ", obj.chat);
    const response = await axios.post(
      apiRequests.postCompletionModel(obj.contact.projectId),
      {
        value: obj.message,
        threadId: obj.contact.threadId,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + storedToken,
        },
      }
    );

    dispatch(
      addMessage({
        senderId: obj.contact.userId,
        text: response.data.message.value,
        sections: response.data.message.messageSections,
        time: new Date(),
      })
    );

    // if threadId is null, then it is a new thread
    let newThread = !obj.contact.threadId;
    if (newThread) {
      let newThreadId = response.data.message.threadId;
      await dispatch(fetchChatsContacts(organizationId, storedToken)); // await to load the new thread before selecting it
      //select the newly created thread, keep the chat content instead of showing the message loader
      dispatch(selectChat({ id: newThreadId, keepChatContent: true, organizationId, storedToken}));
    }

    return response.data;
  } catch (error) {
    console.error("Failed to send message:", error);
    return rejectWithValue(error.message);
  }
  }
);

export const addMessage = createAsyncThunk(
  "appChat/pushMessage",
  async (message, { dispatch, getState }) => {
    return {
      senderId: message.senderId,
      message: message.text,
      sections: message.sections,
      time: "2024-04-06T10:35:38.052581Z",
      feedback: {
        isSent: true,
        isDelivered: true,
        isSeen: true,
      },
    };
  }
);

export const appChatSlice = createSlice({
  name: "appChat",
  initialState: {
    chats: null,
    contacts: null,
    userProfile: null,
    selectedChat: null,
  },
  reducers: {
    removeSelectedChat: (state) => {
      state.selectedChat = null;
    },
    setUserProfile: (state, action) => {
      state.userProfile = chatConverters.toChatUserProfile(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchChatsContacts.fulfilled, (state, action) => {
      console.log("fetchChatsContacts fulfilled: ", action);
      state.contacts = action.payload.contacts;
      state.chats = action.payload.chatsContacts;
    });
    builder.addCase(fetchChatsContacts.pending, (state, action) => {
      console.log("fetchChatsContacts pending: ", action);
    });
    builder.addCase(fetchChatsContacts.rejected, (state, action) => {
      console.log("fetchChatsContacts rejected: ", action);
    });
    builder.addCase(selectChat.pending, (state, action) => {
      console.log("selectChat pending: ", action);
      if (!action.meta.arg.keepChatContent) {
        state.selectedChat = null;
      }
    });
    builder.addCase(selectChat.fulfilled, (state, action) => {
      state.selectedChat = action.payload;
    });
    builder.addCase(addMessage.fulfilled, (state, action) => {
      if (state.selectedChat && state.selectedChat.chat && state.selectedChat.chat.chat) {
      state.selectedChat.chat.chat = [
        ...state.selectedChat.chat.chat,
        action.payload,
      ];
    }
    });
  },
});

export const { removeSelectedChat, setUserProfile } = appChatSlice.actions;

export default appChatSlice.reducer;

function _createNewThreadChat(state, id) {
  const contact = state.chat.contacts.find((contact) => contact.id === id);
  let newThreadChat = {
    contact: { ...contact, id: null, threadId: null },
    chat: {
      chat: [],
    },
  };
  return newThreadChat;
}

async function _fetchExistingChatWithMessages(id, dispatch, thread) {
  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );
  const messagesResponse = await axios.get(
    apiRequests.getThreadMessagesByCriteria(id, 0, 100),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + storedToken,
      },
    }
  );

  const chatMessages = messagesResponse.data.content.map((message) =>
    chatConverters.gendoxMessageToChatMessage(message)
  );

  // sort messages by time ascending
  chatMessages.sort((a, b) => new Date(a.time) - new Date(b.time));

  let selectedChat = {
    contact: { ...thread, threadId: id },
    chat: {
      // "lastMessage": {
      //     "message": "Hello, how are you?",
      //     "time": "2022-03-01T10:30:00Z"
      // },
      // "unseenMsgs": 2,
      chat: chatMessages,
    },
  };
  return selectedChat;
}
