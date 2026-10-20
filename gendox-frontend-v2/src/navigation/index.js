import {
  AppWindow,
  Bot,
  Cable,
  House,
  KeyRound,
  Library,
  ListChecks,
  MessagesSquare
} from 'lucide-react'
import WordPressIcon from 'src/components/ui/WordPressIcon'

/**
 * The app's pages, grouped by the user's journey, for the search (⌘K).
 * The sidebar shows only the agent's pages; the rest are reached from the agent switcher and the account menu.
 */
const navigation = [
  {
    items: [
      { id: 'home', title: 'Home', icon: House, path: '/gendox/agent-home' }
    ]
  },
  {
    label: 'Build',
    items: [
      { id: 'agents', title: 'Agents', icon: Bot, path: '/gendox/agents' },
      { id: 'knowledge', title: 'Knowledge', icon: Library, path: '/gendox/knowledge' },
      { id: 'integrations', title: 'Integrations', icon: Cable, path: '/gendox/integrations' },
      { id: 'tasks', title: 'Tasks', icon: ListChecks, path: '/gendox/tasks' }
    ]
  },
  {
    label: 'Deploy',
    items: [
      { id: 'deploy', title: 'Chat widget', icon: AppWindow, path: '/gendox/agent-deploy' },
      { id: 'wordpress', title: 'WordPress', icon: WordPressIcon, path: '/gendox/wordpress' },
      { id: 'api', title: 'API keys', icon: KeyRound, path: '/gendox/api-keys' }
    ]
  },
  {
    label: 'Monitor',
    items: [{ id: 'conversations', title: 'Conversations', icon: MessagesSquare, path: '/gendox/conversations' }]
  }
]

export default navigation
