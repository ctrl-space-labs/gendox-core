interface Message {
  id?: string
  text?: string
  createdAt?: string
  createdBy?: string
  sections?: any[]
}

interface Thread {
  latestMessageCreatedAt: string
  [key: string]: any
}

interface ThreadGroups {
  Today: Thread[]
  Yesterday: Thread[]
  'Last 7 days': Thread[]
  'Last 30 days': Thread[]
  Older: Thread[]
}

export const formatMessage = (message: Message) => {
  return {
    id: message.id || '',
    text: message.text || '',
    createdAt: message.createdAt || new Date().toISOString(),
    createdBy: message.createdBy || 'System',
    sections: message.sections || []
  }
}

export const groupThreadsByDate = (threads: Thread[]): ThreadGroups => {
  const groups: ThreadGroups = {
    Today: [],
    Yesterday: [],
    'Last 7 days': [],
    'Last 30 days': [],
    Older: []
  }

  const now = new Date()

  threads.forEach(thread => {
    const msgTime = new Date(thread.latestMessageCreatedAt)
    const diffDays = Math.floor((now.getTime() - msgTime.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) groups.Today.push(thread)
    else if (diffDays === 1) groups.Yesterday.push(thread)
    else if (diffDays <= 7) groups['Last 7 days'].push(thread)
    else if (diffDays <= 30) groups['Last 30 days'].push(thread)
    else groups.Older.push(thread)
  })

  return groups
}
