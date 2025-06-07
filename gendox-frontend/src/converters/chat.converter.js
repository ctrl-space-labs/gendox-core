/**
 * Converts a Gendox user profile to a thread user profile.
 *
 * @param {GendoxUserProfile} gendoxUserProfile - The Gendox user profile to convert.
 * @returns {ThreadUserProfile} The converted thread user profile.
 */
const toThreadHeaderInfo = (gendoxUserProfile) => {
  return {
    id: gendoxUserProfile.id,
    fullName: gendoxUserProfile.name,
    email: gendoxUserProfile.email,
  };
};

/**
 * Converts a Project to a thread agent.
 *
 * @param {Project} project - The project to convert.
 * @returns {ThreadAgent} The converted thread agent.
 */
const projectToAgent = (project) => {
  const projectAgent = project.projectAgent || {};
  return {
    id: projectAgent.userId || '',
    userId: projectAgent.userId || '',
    agentId: projectAgent.id || '',
    projectId: project.id || '',
    fullName: projectAgent.agentName || 'Unknown Agent',
    role: "Agent",
    description: project.description || '',
  };
};

/**
 * Converts a Gendox thread to a thread entry using the provided agents.
 *
 * @param {GendoxThread} thread - The thread to convert.
 * @param {ThreadAgent[]} agents - The array of thread agents.
 * @returns {ThreadEntry} The converted thread entry.
 */
const gendoxThreadToThreadEntry = (thread, agents) => {
  // Find the agent matching one of the thread members.
  let agent = agents.find((agent) =>
    thread.chatThreadMembers.some((member) => member.userId === agent.userId)
  );

  return {
    agent: agent,
    id: thread.id,
    threadId: thread.id,
    threadName: thread.name,
    threadCreatedAt: thread.createdAt,
    latestMessageValue: thread.latestMessageValue,
    latestMessageCreatedAt: thread.latestMessageCreatedAt
  };
};

/**
 * Converts a Gendox message to a thread message.
 *
 * @param {GendoxMessage} message - The message to convert.
 * @returns {ThreadMessage} The converted thread message.
 */
const gendoxMessageToThreadMessage = (message) => {
  return {
    messageId: message.id,
    createdBy: message.createdBy || 'anonymous',
    message: message.value,
    sections: message.messageSections,
    createdAt: message.createdAt,
    role: message.role,
    toolName: message.name,
    toolCallId: message.toolCallId,
    toolCalls: message.toolCalls
  };
};


const threadConverters = {
  toThreadHeaderInfo,
  projectToAgent,
  gendoxThreadToThreadEntry,
  gendoxMessageToThreadMessage,
};

export default threadConverters;
