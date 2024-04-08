/**
 * @typedef {Object} ChatUserProfile
 * @property {string} id - The user's ID.
 * @property {string} fullName - The user's full name.
 * @property {string|null} avatar - The user's avatar.
 * @property {string} role - The user's role.
 * @property {string} about - The user's about section.
 * @property {string} status - The user's status.
 * @property {Object} settings - The user's settings.
 * @property {boolean} settings.isTwoStepAuthVerificationEnabled - Indicates if two-step authentication is enabled.
 * @property {boolean} settings.isNotificationsOn - Indicates if notifications are on.
 */

/**
 * @typedef {Object} LastMessage
 * @property {string} message - The last message text.
 * @property {string} time - The time when the last message was sent.
 */

/**
 * @typedef {Object} Chat
 * @property {LastMessage} lastMessage - The last message details.
 * @property {number} unseenMsgs - The number of unseen messages.
 */

/**
 * @typedef {Object} ChatContact
 * @property {string} id - The contact's ID - Gendox Agent Id.
 * @property {string} userId - The user ID for this Gendox Agent.
 * @property {string} agentId - The agent ID.
 * @property {string} projectId - The project ID.
 * @property {string} fullName - The contact's full name.
 * @property {string} role - The contact's role.
 * @property {string} about - The contact's about section.
 * @property {string|null} avatar - The contact's avatar.
 * @property {string} status - The contact's status.
 * @property {Chat?} chat - The chat details. This property is optional.*
 * @property {string?} threadId - The ID of the thread. This property is optional.*
 */

/**
 * @typedef {Object} ThreadMember
 * @property {string} id - The ID of the thread member.
 * @property {string} userId - The ID of the user.
 * @property {string} createdAt - The creation date of the thread member.
 * @property {string} updatedAt - The last update date of the thread member.
 * @property {string} createdBy - The ID of the user who created the thread member.
 * @property {string} updatedBy - The ID of the user who last updated the thread member.
 */

/**
 * @typedef {Object} GendoxThread
 * @property {string} id - The ID of the thread.
 * @property {string} name - The name of the thread.
 * @property {string} projectId - The ID of the project.
 * @property {string} createdAt - The creation date of the thread.
 * @property {string} updatedAt - The last update date of the thread.
 * @property {string} createdBy - The ID of the user who created the thread.
 * @property {string} updatedBy - The ID of the user who last updated the thread.
 * @property {ThreadMember[]} chatThreadMembers - The members of the thread.
 */

/**
 * @typedef {Object} Feedback
 * @property {boolean} isSent - Whether the message is sent.
 * @property {boolean} isDelivered - Whether the message is delivered.
 * @property {boolean} isSeen - Whether the message is seen.
 */

/**
 * @typedef {Object} ChatMessage
 * @property {string} senderId - The sender's ID.
 * @property {string} message - The message text.
 * @property {string} time - The time when the message was sent.
 * @property {Feedback} feedback - The feedback for the message.
 */

/**
 * @typedef {Object} GendoxMessage
 * @property {string} id - The ID of the message.
 * @property {string} value - The content of the message.
 * @property {string} projectId - The ID of the project.
 * @property {string} threadId - The ID of the thread.
 * @property {string} createdAt - The creation date of the message.
 * @property {string} updatedAt - The last update date of the message.
 * @property {string} createdBy - The ID of the user who created the message.
 * @property {string} updatedBy - The ID of the user who last updated the message.
 */