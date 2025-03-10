export const formatMessage = message => {
  return {
    id: message.id || '',
    text: message.text || '',
    createdAt: message.createdAt || new Date().toISOString(),
    createdBy: message.createdBy || 'System',
    sections: message.sections || []
  }
}

export const groupThreadsByDate = threads => {
  const groups = {
    Today: [],
    Yesterday: [],
    'Last 7 days': [],
    'Last 30 days': [],
    Older: []
  }

  const now = new Date()

  threads.forEach(thread => {
    const msgTime = new Date(thread.latestMessageCreatedAt)
    const diffDays = Math.floor((now - msgTime) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) groups.Today.push(thread)
    else if (diffDays === 1) groups.Yesterday.push(thread)
    else if (diffDays <= 7) groups['Last 7 days'].push(thread)
    else if (diffDays <= 30) groups['Last 30 days'].push(thread)
    else groups.Older.push(thread)
  })

  return groups
}
