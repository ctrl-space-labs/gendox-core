/**
 * Converts a Gendox user profile to a chat user profile.
 *
 * @param {GendoxUserProfile} gendoxUserProfile - The Gendox user profile to convert.
 * @returns {ChatUserProfile} The converted chat user profile.
 */
const toChatUserProfile = (gendoxUserProfile) => {

    return {
        id: gendoxUserProfile.id,
        fullName: gendoxUserProfile.name,
        avatar: null,
        role: "Role",
        about: "About Section",
        status: 'online',
        settings: {
            isTwoStepAuthVerificationEnabled: false,
            isNotificationsOn: true
        }
    }
}

/**
 * Converts a Project to a chat contact.
 *
 * @param {Project} project - The project to convert.
 * @returns {ChatContact} The converted chat contact.
 */
const projectToContact = (project) => {

    return {
        id: project.projectAgent.userId,
        userId: project.projectAgent.userId,
        agentId: project.projectAgent.id,
        projectId: project.id,
        fullName: project.projectAgent.agentName,
        role: "Agent",
        about: project.description,
        avatar: null,
        status: 'online'
    }

}

/**
 * Converts a Gendox thread to a chat entry. get the array of Chat Contacts
 * @param {GendoxThread} thread - The thread to convert.
 * @param {ChatContact[]} contacts - The array of chat contacts.
 * @returns {ChatContact} The converted chat entry.
 */
const gendoxThreadToChatEntry = (thread, contacts) => {
// find the contact where the id is in any member of the thread
    let contact = contacts.find(contact => thread.chatThreadMembers.some(member => member.userId === contact.userId));

        return {
            ...contact,
            id: thread.id,
            threadId: thread.id,
            chat: {
                lastMessage: {
                    message: 'A message',
                    time: thread.updatedAt,
                },
                "unseenMsgs": 2
            }
        }
}

/**
 * Converts a Gendox message to a chat message.
 * @param {GendoxMessage} message - The message to convert.
 * @returns {ChatMessage} The converted chat message.
 */
const gendoxMessageToChatMessage = (message) => {
    return {
        senderId: message.createdBy,
        message: message.value,
        time: message.createdAt,
        feedback: {
            isSent: true,
            isDelivered: true,
            isSeen: true
        }

    }
}

const chatConverters = {

    toChatUserProfile,
    projectToContact,
    gendoxThreadToChatEntry,
    gendoxMessageToChatMessage
}

export default chatConverters;