// ** Redux Imports
import {createSlice, createAsyncThunk} from '@reduxjs/toolkit'

import {useAuth} from 'src/hooks/useAuth'
import chatConverters from "../../../converters/chat.converter";

// ** Axios Imports
import axios from 'axios'
import {uid} from "chart.js/helpers";
import apiRequests from "../../../configs/apiRequest";
import authConfig from "src/configs/auth";


// ** Fetch Chats & Contacts
export const fetchChatsContacts = createAsyncThunk('appChat/fetchChatsContacts', async () => {


    const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)
    const projectsByOrgResponse = await axios.get(apiRequests.getProjectsByOrganization('c83a1c61-4c79-4c49-8b3e-249e8c40a39f'), {
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + storedToken
        }
    })

    //TODO remove this hardcoded projects
    let hardcodedProjects = ['0c154e6e-04b3-492a-94bf-61b8c5ad1644','5ffbc620-c246-49ca-b7c7-7df0728f8d32','4fd12adf-763b-4d17-a72b-df9f71b50e0d','32c78481-510d-4d11-8269-4469c63a4be9','2ae17bf3-333f-40ca-8840-f3736b9b324c','1bc3b6d9-2d24-471c-9ef2-de9376d6fa12','25e20a08-1019-4118-a0d7-e68fd812d766']
    const threadsResponse = await axios.get(
        apiRequests.getThreadsByCriteria(
            // projectsByOrgResponse.data.content.map(project => project.id)
            hardcodedProjects
        ), {
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + storedToken
        }
    })


    // map each project in resp.data.content to a chat contact
    const contacts = projectsByOrgResponse.data.content.map(project => chatConverters.projectToContact(project))

    const chatEntries = threadsResponse.data.content.map(thread => chatConverters.gendoxThreadToChatEntry(thread, contacts))


    console.log("fetchChatsContacts contacts: ", contacts)
    console.log("fetchChatsContacts chatEntries: ", chatEntries)
    return {
        chatsContacts: chatEntries,
        contacts: contacts,
    }
})

// ** Select Chat
export const selectChat = createAsyncThunk('appChat/selectChat', async (id, {dispatch, getState}) => {

    const state = getState()

    let contacts = state.chat.contacts
    const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)
    const messagesResponse = await axios.get(apiRequests.getThreadMessagesByCriteria(id, 0, 100), {
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + storedToken
        }
    })

    const chatMessages = messagesResponse.data.content.map(message => chatConverters.gendoxMessageToChatMessage(message))

    // sort messages by time ascending
    chatMessages.sort((a, b) => new Date(a.time) - new Date(b.time))
    dispatch(fetchChatsContacts())

    let contact = contacts.find(contact => chatMessages.some(message => message.senderId === contact.userId));


    // return response.data
    return {
        "contact": {...contact, threadId: id},
        "chat": {
            // "lastMessage": {
            //     "message": "Hello, how are you?",
            //     "time": "2022-03-01T10:30:00Z"
            // },
            // "unseenMsgs": 2,
            "chat": chatMessages

        }
    }
})

// ** Send Msg
export const sendMsg = createAsyncThunk('appChat/sendMsg', async (obj, {dispatch, getState}) => {

    const state = getState();

    //chat append string
    dispatch(addMessage({senderId: state.chat.userProfile.id, text: obj.message, time: new Date()}))


    let storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)

    console.log("sendMsg chat2: ", obj.chat)
    const response = await axios.post(apiRequests.postCompletionModel(obj.contact.projectId), {
        value: obj.message,
        threadId: obj.contact.threadId
    }, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + storedToken
        }
    });

    dispatch(addMessage({
        senderId: obj.contact.userId,
        text: response.data.message.value,
        time: new Date()
    }))

    // if (obj.contact) {
    //     await dispatch(selectChat(obj.contact.id))
    // }
    // await dispatch(fetchChatsContacts())

    return response.data
})


export const addMessage = createAsyncThunk('appChat/pushMessage', async (message, {dispatch, getState}) => {

    return {
        "senderId": message.senderId,
        "message": message.text,
        "time": "2024-04-06T10:35:38.052581Z",
        "feedback": {
            "isSent": true,
            "isDelivered": true,
            "isSeen": true
        }
    }

})

export const appChatSlice = createSlice({
    name: 'appChat',
    initialState: {
        chats: null,
        contacts: null,
        userProfile: null,
        selectedChat: null
    },
    reducers: {
        removeSelectedChat: state => {
            state.selectedChat = null
        },
        setUserProfile: (state, action) => {
            state.userProfile = chatConverters.toChatUserProfile(action.payload);
        }
    },
    extraReducers: builder => {
        builder.addCase(fetchChatsContacts.fulfilled, (state, action) => {
            console.log("fetchChatsContacts fulfilled: ", action)
            state.contacts = action.payload.contacts
            state.chats = action.payload.chatsContacts
        })
        builder.addCase(fetchChatsContacts.pending, (state, action) => {

            console.log("fetchChatsContacts pending: ", action)
        })
        builder.addCase(fetchChatsContacts.rejected, (state, action) => {
            console.log("fetchChatsContacts rejected: ", action)
        })
        builder.addCase(selectChat.pending, (state, action) => {
            state.selectedChat = null
        })
        builder.addCase(selectChat.fulfilled, (state, action) => {
            state.selectedChat = action.payload
        })
        builder.addCase(addMessage.fulfilled, (state, action) => {
            state.selectedChat.chat.chat = [...state.selectedChat.chat.chat, action.payload]
        })
    }
})

export const {removeSelectedChat, setUserProfile} = appChatSlice.actions

export default appChatSlice.reducer
