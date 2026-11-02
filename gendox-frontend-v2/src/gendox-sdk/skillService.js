import axios from 'axios'
import apiRequests from 'src/configs/apiRequest.js'

const headers = token => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`
})

/**
 * The Gendox skills: the latest version of each, to add to an agent.
 * An agent's own skills are saved with the agent, like its tools.
 */
const getSkillLibrary = async token => {
  return axios.get(apiRequests.skills(), { headers: headers(token) })
}

/** The built-in Gendox tools a SKILL.md may name in allowed-tools: [{ name, description }]. */
const getSkillTools = async token => {
  return axios.get(apiRequests.skillTools(), { headers: headers(token) })
}

/** Super admin: create a Gendox skill from a SKILL.md. */
const createSkill = async (content, token) => {
  return axios.post(apiRequests.skills(), { content }, { headers: headers(token) })
}

/** Super admin: publish a new version. Agents that have the skill move to it. */
const publishSkillVersion = async (name, content, token) => {
  return axios.put(apiRequests.skill(name), { content }, { headers: headers(token) })
}

/** Super admin: remove from the library. Agents keep their copies. */
const deleteSkill = async (name, token) => {
  return axios.delete(apiRequests.skill(name), { headers: headers(token) })
}

export default {
  getSkillLibrary,
  getSkillTools,
  createSkill,
  publishSkillVersion,
  deleteSkill
}
