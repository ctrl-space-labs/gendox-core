// ** Redux Imports
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import { useAuth } from "src/hooks/useAuth";
import chatConverters from "../../../converters/chat.converter";
import { useRouter } from "next/router";

// ** Axios Imports

import authConfig from "src/configs/auth";
import projectService from "src/gendox-sdk/projectService";
import { generalConstants } from "src/utils/generalConstants";
import completionService from "../../../gendox-sdk/completionService";
import chatThreadService from "../../../gendox-sdk/chatThreadService";

// ** Fetch Chats & Contacts
export const fetchChatsContacts = createAsyncThunk(
  "appChat/fetchChatsContacts",
  async ({ organizationId, storedToken }, { rejectWithValue }) => {
    try {
      const projectsByOrgResponse =
        await projectService.getProjectsByOrganization(
          organizationId,
          storedToken
        );

      const projectIds = projectsByOrgResponse.data.content.map(
        (project) => project.id
      );
      if (projectIds.length === 0) {
        return {
          chatsContacts: [],
          contacts: [],
        };
      }

      let localThreadIds = null;

      // unauthenticated user
      if (!storedToken || storedToken === generalConstants.NO_AUTH_TOKEN) {
        const localThreads =
          JSON.parse(
            localStorage.getItem(generalConstants.LOCAL_STORAGE_THREAD_IDS_NAME)
          ) || [];
        localThreadIds = localThreads.map((thread) => thread.threadId);
      }

      const threadsResponse = await chatThreadService.getThreadsByCriteria(
        projectIds,
        localThreadIds,
        storedToken
      );

      const threads = threadsResponse.data.content;

      if (threads.length === 0) {
        return {
          chatsContacts: [],
          contacts: projectsByOrgResponse.data.content.map((project) =>
            chatConverters.projectToContact(project)
          ),
        };
      }

      const contacts = projectsByOrgResponse.data.content.map((project) => {
        // Ensure projectAgent and its properties are handled properly
        if (!project.projectAgent) {
          console.warn("Project has no projectAgent:", project);
          return {
            id: "",
            userId: "",
            agentId: "",
            projectId: project.id || "",
            fullName: "Unknown Agent",
            role: "Agent",
            about: project.description || "No description available",
            avatar: null,
            status: "offline",
          };
        }
        return chatConverters.projectToContact(project);
      });

      const chatEntries = threads.map((thread) =>
        chatConverters.gendoxThreadToChatEntry(thread, contacts)
      );      

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
    { threadId, keepChatContent = false, organizationId, storedToken },
    { dispatch, getState, rejectWithValue }
  ) => {
    try {
      const state = getState();
      let thread = state.chat.chats.find((thread) => thread.id === threadId);
      let newThread = !thread;

      if (newThread) {
        return _createNewThreadChat(state, threadId);
      }

      let selectedChat = await _fetchExistingChatWithMessages(
        threadId,
        dispatch,
        thread
      );

      await dispatch(fetchChatsContacts({ organizationId, storedToken }));

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
  async (obj, { dispatch, getState, rejectWithValue }) => {
    try {
      const state = getState();
      let storedToken = window.localStorage.getItem(
        authConfig.storageTokenKeyName
      );

      const userProfile = state.chat.userProfile;
      if (!userProfile?.id) {
        throw new Error("User profile is missing or invalid");
      }

      const { projectId, threadId, userId } = obj.contact;
      const { message } = obj;

      // Chat append string
      dispatch(
        addMessage({
          senderId: userProfile.id,
          text: message,
          time: new Date(),
        })
      );

      // Send the message to the server
      const response = await completionService.postCompletionMessage(
        projectId,
        threadId,
        message,
        storedToken
      );

      const {
        value,
        messageSections,
        threadId: responseThreadId,
      } = response.data.message;

      dispatch(
        addMessage({
          senderId: userId,
          text: value,
          sections: messageSections,
          time: new Date(),
        })
      );

      const isNewThread = !threadId;
      const finalThreadId = isNewThread ? responseThreadId : threadId;

      if (isNewThread) {
        _updateThreadsToLocalStorage(responseThreadId);
      }

      // Fetch chats and select the chat thread
      await dispatch(
        fetchChatsContacts({ organizationId: obj.organizationId, storedToken })
      );
      dispatch(
        selectChat({
          threadId: finalThreadId,
          keepChatContent: true,
          organizationId: obj.organizationId,
          storedToken,
        })
      );

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
      time: new Date().toISOString(),
      feedback: {
        isSent: true,
        isDelivered: true,
        isSeen: true,
      },
    };
  }
);

// ** Fetch ThreadId
export const fetchThreadId = createAsyncThunk(
  "appChat/fetchThreadId",
  async ({ projectId }, { getState, rejectWithValue }) => {
    try {
      const contacts = getState().chat.contacts || [];
      if (contacts.length === 0) {
        throw new Error("No contacts available to find threadId.");
      }

      // Find the project agent for the given projectId
      const projectAgent =
        contacts.find((agent) => agent.projectId === projectId) ?? null;

      if (!projectAgent) {
        console.warn(`No agent found for projectId: ${projectId}`);
        return null; // No threadId found
      }

      return projectAgent.userId; // Return the userId as the threadId
    } catch (error) {
      console.error("Failed to fetch threadId:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const appChatSlice = createSlice({
  name: "appChat",
  initialState: {
    chats: null,
    contacts: null,
    userProfile: null,
    selectedChat: null,
    isSending: false,
    threadId: null,
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
      state.contacts = action.payload.contacts;
      state.chats = action.payload.chatsContacts;
    });
    builder.addCase(fetchChatsContacts.pending, (state, action) => {
      state.isSending = false;
    });
    builder.addCase(fetchChatsContacts.rejected, (state, action) => {
      state.isSending = false;
    });
    builder.addCase(selectChat.pending, (state, action) => {
      if (!action.meta.arg.keepChatContent) {
        state.isSending = false;
        state.selectedChat = null;
      }
    });
    builder.addCase(selectChat.fulfilled, (state, action) => {
      state.selectedChat = action.payload;
    });
    builder.addCase(sendMsg.pending, (state) => {
      state.isSending = true; // Set isSending to true when sendMsg starts
    });
    builder.addCase(sendMsg.fulfilled, (state, action) => {
      state.isSending = false; // Set isSending to false on success
    });
    builder.addCase(sendMsg.rejected, (state) => {
      state.isSending = false; // Ensure isSending is false on failure
    });
    builder.addCase(addMessage.fulfilled, (state, action) => {
      if (
        state.selectedChat &&
        state.selectedChat.chat &&
        state.selectedChat.chat.chat
      ) {
        state.selectedChat.chat.chat = [
          ...state.selectedChat.chat.chat,
          action.payload,
        ];
      }
    });
    builder.addCase(fetchThreadId.fulfilled, (state, action) => {
      state.threadId = action.payload; // Store the fetched threadId in the Redux state
    });
  },
});

export const { removeSelectedChat, setUserProfile } = appChatSlice.actions;

export default appChatSlice.reducer;

function _createNewThreadChat(state, id) {
  // const contact = state.chat.contacts.find((contact) => contact.id === id);
  const contact = state.chat.contacts.find(
    (contact) =>
      contact.threadId === id || contact.id === id || contact.userId === id
  );

  let newThreadChat = {
    contact: { ...contact, id: null, threadId: null },
    chat: {
      chat: [],
    },
  };
  return newThreadChat;
}

/**
 * Update the threads in localStorage by removing the old ones and adding the new one
 *
 * @param newThreadId
 * @private
 */
function _updateThreadsToLocalStorage(newThreadId) {
  // Retrieve the existing array from localStorage
  let threads =
    JSON.parse(
      localStorage.getItem(generalConstants.LOCAL_STORAGE_THREAD_IDS_NAME)
    ) || [];

  // remove threads older than 2 weeks old
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  threads = threads.filter(
    (thread) => new Date(thread.createdAt) > twoWeeksAgo
  );

  // Push the newThreadId to the array
  threads.push({
    threadId: newThreadId,
    createdAt: new Date().toISOString(),
  });

  // Save the updated array back to localStorage
  localStorage.setItem(
    generalConstants.LOCAL_STORAGE_THREAD_IDS_NAME,
    JSON.stringify(threads)
  );
}

async function _fetchExistingChatWithMessages(id, dispatch, thread) {
  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );
  const messagesResponse = await chatThreadService.getThreadMessagesByCriteria(
    id,
    storedToken
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
