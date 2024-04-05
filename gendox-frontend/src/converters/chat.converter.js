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
        id: project.projectAgent.id,
        fullName: project.projectAgent.agentName,
        role: "Agent",
        about: project.description,
        avatar: null,
        status: 'online'
    }

}

const chatConverters = {

    toChatUserProfile,
    projectToContact
}

export default chatConverters;