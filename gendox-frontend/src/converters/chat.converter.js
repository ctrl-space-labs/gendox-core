

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
        email: gendoxUserProfile.email,
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
    const projectAgent = project.projectAgent || {};
    
    return {
        id: projectAgent.userId || '',
        userId: projectAgent.userId || '',
        agentId: projectAgent.id || '',
        projectId: project.id || '',
        fullName: projectAgent.agentName || 'Unknown Agent',
        role: "Agent",
        about: project.description || 'No description available',
        avatar: null,
        status: 'online'
      };
    };

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
            threadName: thread.name,
            threadCreatedAt: thread.createdAt,
            chat: {
                lastMessage: {
                    message: thread.name,
                    time: thread.updatedAt,                    
                },
                "unseenMsgs": 0,
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
        senderId: message.createdBy || 'anonymous',
        message: message.value,
        messageId : message.id,
        sections: message.messageSections,
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