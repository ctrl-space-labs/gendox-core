// A SKILL.md in the Agent Skills format Claude Code and Codex use: front matter between --- lines
// with `name` and `description`, then Markdown. The live check here mirrors the backend's
// SkillMarkdownParser; the backend reads the front matter as real YAML and has the last word.

const SKILL_NAME_PATTERN = /^[a-z0-9-]{1,64}$/
const MAX_SKILL_LENGTH = 50000

export const NEW_SKILL_TEMPLATE = `---
name: 
description: 
---

# 

1. `

const FRONT_MATTER = /^﻿?\s*---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(\r?\n|$)/

const unquote = value => {
  const trimmed = value.trim()
  if (trimmed.length >= 2 && (trimmed[0] === '"' || trimmed[0] === "'") && trimmed.endsWith(trimmed[0])) {
    return trimmed.slice(1, -1)
  }

  return trimmed
}

/** allowed-tools as written: a YAML list ("- name" lines) or one string separated by commas or spaces. */
const readTools = (inline, listLines) => {
  const names = inline ? inline.replace(/^\[|\]$/g, '').split(/[,\s]+/) : listLines
  return [...new Set(names.map(name => name.trim()).filter(Boolean))]
}

/**
 * Parses a SKILL.md. Returns { name, description, tools, body, errors }; errors is empty when the
 * file is valid. With knownTools (the built-in tool names), an unknown name in allowed-tools is an
 * error, as it is on the server.
 */
export const parseSkill = (content, knownTools) => {
  const errors = []
  const text = content || ''

  if (text.length > MAX_SKILL_LENGTH) {
    errors.push(`A skill can be at most ${MAX_SKILL_LENGTH} characters`)
  }

  const match = FRONT_MATTER.exec(text)
  if (!match) {
    return { name: '', description: '', tools: [], body: text, errors: ['Start with front matter between --- lines'] }
  }

  const fields = {}
  const toolListLines = []
  let lastKey = null
  match[1].split(/\r?\n/).forEach(line => {
    const at = line.indexOf(':')
    if (at > 0 && !/^\s/.test(line)) {
      lastKey = line.slice(0, at).trim()
      fields[lastKey] = unquote(line.slice(at + 1))
    } else if (lastKey === 'allowed-tools' && /^\s*-\s+/.test(line)) {
      toolListLines.push(unquote(line.replace(/^\s*-\s+/, '')))
    }
  })
  const tools = readTools(fields['allowed-tools'], toolListLines)

  const name = fields.name || ''
  const description = fields.description || ''
  if (!name) errors.push('Add a name')
  else if (!SKILL_NAME_PATTERN.test(name)) errors.push('The name takes lowercase letters, numbers and dashes')
  if (!description) errors.push('Add a description: when should the agent use it?')
  if (knownTools) {
    tools
      .filter(tool => tool === 'read_skill' || !knownTools.includes(tool))
      .forEach(tool => errors.push(`allowed-tools: ${tool} is not a Gendox tool`))
  }

  return { name, description, tools, body: text.slice(match[0].length), errors }
}

/** Renames a skill in its front matter, for "Edit a copy". */
export const renameSkill = (content, newName) => {
  return (content || '').replace(/^(﻿?\s*---[ \t]*\r?\n[\s\S]*?)^name:.*$/m, `$1name: ${newName}`)
}

/** Saves a skill as SKILL.md in a folder named after it, the layout Claude Code and Codex expect. */
export const downloadSkill = skill => {
  const blob = new Blob([skill.content || ''], { type: 'text/markdown;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${skill.name || 'skill'}-SKILL.md`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(link.href)
}
