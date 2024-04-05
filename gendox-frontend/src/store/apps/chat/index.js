// ** Redux Imports
import {createSlice, createAsyncThunk} from '@reduxjs/toolkit'

import {useAuth} from 'src/hooks/useAuth'
import chatConverters from "../../../converters/chat.converter";

// ** Axios Imports
import axios from 'axios'
import {uid} from "chart.js/helpers";
import apiRequests from "../../../configs/apiRequest";
import authConfig from "src/configs/auth";

const previousDay = new Date(new Date().getTime() - 24 * 60 * 60 * 1000)
const dayBeforePreviousDay = new Date(new Date().getTime() - 24 * 60 * 60 * 1000 * 2)

const data = {
    contacts: [
        {
            id: 1,
            fullName: 'Felecia Rower',
            role: 'Frontend Developer',
            about: 'Cake pie jelly jelly beans. Marzipan lemon drops halvah cake. Pudding cookie lemon drops icing',
            avatar: '/images/avatars/2.png',
            status: 'offline'
        },
        {
            id: 2,
            fullName: 'Adalberto Granzin',
            role: 'UI/UX Designer',
            avatarColor: 'primary',
            about:
                'Toffee caramels jelly-o tart gummi bears cake I love ice cream lollipop. Sweet liquorice croissant candy danish dessert icing. Cake macaroon gingerbread toffee sweet.',
            status: 'busy'
        },
        {
            id: 3,
            fullName: 'Joaquina Weisenborn',
            role: 'Town planner',
            about:
                'Soufflé soufflé caramels sweet roll. Jelly lollipop sesame snaps bear claw jelly beans sugar plum sugar plum.',
            avatar: '/images/avatars/8.png',
            status: 'busy'
        },
        {
            id: 4,
            fullName: 'Verla Morgano',
            role: 'Data scientist',
            about:
                'Chupa chups candy canes chocolate bar marshmallow liquorice muffin. Lemon drops oat cake tart liquorice tart cookie. Jelly-o cookie tootsie roll halvah.',
            avatar: '/images/avatars/3.png',
            status: 'online'
        },
        {
            id: 5,
            fullName: 'Margot Henschke',
            role: 'Dietitian',
            avatarColor: 'success',
            about: 'Cake pie jelly jelly beans. Marzipan lemon drops halvah cake. Pudding cookie lemon drops icing',
            status: 'busy'
        },
        {
            id: 6,
            fullName: 'Sal Piggee',
            role: 'Marketing executive',
            about:
                'Toffee caramels jelly-o tart gummi bears cake I love ice cream lollipop. Sweet liquorice croissant candy danish dessert icing. Cake macaroon gingerbread toffee sweet.',
            avatar: '/images/avatars/5.png',
            status: 'online'
        },
        {
            id: 7,
            fullName: 'Miguel Guelff',
            role: 'Special educational needs teacher',
            about:
                'Biscuit powder oat cake donut brownie ice cream I love soufflé. I love tootsie roll I love powder tootsie roll.',
            avatar: '/images/avatars/7.png',
            status: 'online'
        },
        {
            id: 8,
            fullName: 'Mauro Elenbaas',
            role: 'Advertising copywriter',
            about:
                'Bear claw ice cream lollipop gingerbread carrot cake. Brownie gummi bears chocolate muffin croissant jelly I love marzipan wafer.',
            avatar: '/images/avatars/6.png',
            status: 'away'
        },
        {
            id: 9,
            avatarColor: 'warning',
            fullName: 'Bridgett Omohundro',
            role: 'Designer, television/film set',
            about:
                'Gummies gummi bears I love candy icing apple pie I love marzipan bear claw. I love tart biscuit I love candy canes pudding chupa chups liquorice croissant.',
            status: 'offline'
        },
        {
            id: 10,
            avatarColor: 'error',
            fullName: 'Zenia Jacobs',
            role: 'Building surveyor',
            about: 'Cake pie jelly jelly beans. Marzipan lemon drops halvah cake. Pudding cookie lemon drops icing',
            status: 'away'
        }
    ],
    chats: [
        {
            id: 1,
            userId: 1,
            unseenMsgs: 1,
            chat: [
                {
                    message: "How can we help? We're here for you!",
                    time: 'Mon Dec 10 2018 07:45:00 GMT+0000 (GMT)',
                    senderId: 11,
                    feedback: {
                        isSent: true,
                        isDelivered: true,
                        isSeen: true
                    }
                },
                {
                    message: 'Hey John, I am looking for the best admin template. Could you please help me to find it out?',
                    time: 'Mon Dec 10 2018 07:45:23 GMT+0000 (GMT)',
                    senderId: 1,
                    feedback: {
                        isSent: true,
                        isDelivered: true,
                        isSeen: true
                    }
                },
                {
                    message: 'It should be MUI v5 compatible.',
                    time: 'Mon Dec 10 2018 07:45:55 GMT+0000 (GMT)',
                    senderId: 1,
                    feedback: {
                        isSent: true,
                        isDelivered: true,
                        isSeen: true
                    }
                },
                {
                    message: 'Absolutely!',
                    time: 'Mon Dec 10 2018 07:46:00 GMT+0000 (GMT)',
                    senderId: 11,
                    feedback: {
                        isSent: true,
                        isDelivered: true,
                        isSeen: true
                    }
                },
                {
                    message: 'This admin template is built with MUI!',
                    time: 'Mon Dec 10 2018 07:46:05 GMT+0000 (GMT)',
                    senderId: 11,
                    feedback: {
                        isSent: true,
                        isDelivered: true,
                        isSeen: true
                    }
                },
                {
                    message: 'Looks clean and fresh UI. 😍',
                    time: 'Mon Dec 10 2018 07:46:23 GMT+0000 (GMT)',
                    senderId: 1,
                    feedback: {
                        isSent: true,
                        isDelivered: true,
                        isSeen: true
                    }
                },
                {
                    message: "It's perfect for my next project.",
                    time: 'Mon Dec 10 2018 07:46:33 GMT+0000 (GMT)',
                    senderId: 1,
                    feedback: {
                        isSent: true,
                        isDelivered: true,
                        isSeen: true
                    }
                },
                {
                    message: 'How can I purchase it?',
                    time: 'Mon Dec 10 2018 07:46:43 GMT+0000 (GMT)',
                    senderId: 1,
                    feedback: {
                        isSent: true,
                        isDelivered: true,
                        isSeen: true
                    }
                },
                {
                    message: 'Thanks, From our official site  😇',
                    time: 'Mon Dec 10 2018 07:46:53 GMT+0000 (GMT)',
                    senderId: 11,
                    feedback: {
                        isSent: true,
                        isDelivered: true,
                        isSeen: true
                    }
                },
                {
                    message: 'I will purchase it for sure. 👍',
                    time: previousDay,
                    senderId: 1,
                    feedback: {
                        isSent: true,
                        isDelivered: true,
                        isSeen: true
                    }
                }
            ]
        },
        {
            id: 2,
            userId: 2,
            unseenMsgs: 0,
            chat: [
                {
                    message: 'Hi',
                    time: 'Mon Dec 10 2018 07:45:00 GMT+0000 (GMT)',
                    senderId: 11,
                    feedback: {
                        isSent: true,
                        isDelivered: true,
                        isSeen: true
                    }
                },
                {
                    message: 'Hello. How can I help You?',
                    time: 'Mon Dec 11 2018 07:45:15 GMT+0000 (GMT)',
                    senderId: 2,
                    feedback: {
                        isSent: true,
                        isDelivered: true,
                        isSeen: true
                    }
                },
                {
                    message: 'Can I get details of my last transaction I made last month? 🤔',
                    time: 'Mon Dec 11 2018 07:46:10 GMT+0000 (GMT)',
                    senderId: 11,
                    feedback: {
                        isSent: true,
                        isDelivered: true,
                        isSeen: true
                    }
                },
                {
                    message: 'We need to check if we can provide you such information.',
                    time: 'Mon Dec 11 2018 07:45:15 GMT+0000 (GMT)',
                    senderId: 2,
                    feedback: {
                        isSent: true,
                        isDelivered: true,
                        isSeen: true
                    }
                },
                {
                    message: 'I will inform you as I get update on this.',
                    time: 'Mon Dec 11 2018 07:46:15 GMT+0000 (GMT)',
                    senderId: 2,
                    feedback: {
                        isSent: true,
                        isDelivered: true,
                        isSeen: true
                    }
                },
                {
                    message: 'If it takes long you can mail me at my mail address.',
                    time: dayBeforePreviousDay,
                    senderId: 11,
                    feedback: {
                        isSent: true,
                        isDelivered: false,
                        isSeen: false
                    }
                }
            ]
        }
    ]
}


// ** Fetch Chats & Contacts
export const fetchChatsContacts = createAsyncThunk('appChat/fetchChatsContacts', async () => {


    const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)
    const resp = await axios.get(apiRequests.getProjectsByOrganization('c83a1c61-4c79-4c49-8b3e-249e8c40a39f'), {
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + storedToken
        }
    })
    // map each project in resp.data.content to a chat contact
    const contacts = resp.data.content.map(project => chatConverters.projectToContact(project))


    return {
        chatsContacts: [{
            id: 1,
            fullName: 'Felecia Rower',
            role: 'Frontend Developer',
            about: 'Cake pie jelly jelly beans. Marzipan lemon drops halvah cake. Pudding cookie lemon drops icing',
            avatar: '/images/avatars/2.png',
            status: 'online',
            "chat": {
                "lastMessage": {
                    "message": "Hello, how are you?",
                    "time": "2022-03-01T10:30:00Z"
                },
                "unseenMsgs": 2
            }
        }],
        contacts: contacts,
    }
})

// ** Select Chat
export const selectChat = createAsyncThunk('appChat/selectChat', async (id, {dispatch}) => {
    // const response = await axios.get('/apps/chat/get-chat', {
    //   params: {
    //     id
    //   }
    // })
    await dispatch(fetchChatsContacts())

    // return response.data
    return {
        "contact": {
            id: 1,
            fullName: 'Felecia Rower',
            role: 'Frontend Developer',
            about: 'Cake pie jelly jelly beans. Marzipan lemon drops halvah cake. Pudding cookie lemon drops icing',
            avatar: '/images/avatars/2.png',
            status: 'offline'
        },
        "chat": {
            "lastMessage": {
                "message": "Hello, how are you?",
                "time": "2022-03-01T10:30:00Z"
            },
            "unseenMsgs": 2,
            "chat": [
                {
                    "senderId": "1",
                    "message": "Hello, how are you?",
                    "time": "2022-03-01T10:30:00Z",
                    "feedback": {
                        "isSent": true,
                        "isDelivered": true,
                        "isSeen": true
                    }
                },
                {
                    "senderId": "2",
                    "message": "I'm good, thanks!",
                    "time": "2022-03-01T10:31:00Z",
                    "feedback": {
                        "isSent": true,
                        "isDelivered": true,
                        "isSeen": false
                    }
                }
            ]
        }
    }
})

// ** Send Msg
export const sendMsg = createAsyncThunk('appChat/sendMsg', async (obj, {dispatch}) => {
    const response = await axios.post('/apps/chat/send-msg', {
        data: {
            obj
        }
    })
    if (obj.contact) {
        await dispatch(selectChat(obj.contact.id))
    }
    await dispatch(fetchChatsContacts())

    return response.data
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
        builder.addCase(selectChat.fulfilled, (state, action) => {
            state.selectedChat = action.payload
        })
    }
})

export const {removeSelectedChat, setUserProfile} = appChatSlice.actions

export default appChatSlice.reducer
