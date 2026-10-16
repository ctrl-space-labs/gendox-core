import {
  AppWindow,
  Bot,
  Cable,
  House,
  KeyRound,
  Library,
  ListChecks,
  MessageSquareText,
  MessagesSquare
} from 'lucide-react'
import WordPressIcon from 'src/components/ui/WordPressIcon'

/**
 * The sidebar of the organization layout, grouped by the user's journey.
 * An item gets a `path` when its page exists in this app; until then it shows as not available yet.
 */
const navigation = [
  {
    items: [
      { id: 'home', title: 'Home', icon: House, path: '/gendox/home' },
      { id: 'chat', title: 'Chat', icon: MessageSquareText, path: '/gendox/chat' }
    ]
  },
  {
    label: 'Build',
    items: [
      { id: 'agents', title: 'Agents', icon: Bot, path: '/gendox/agents' },
      { id: 'knowledge', title: 'Knowledge', icon: Library, path: '/gendox/knowledge' },
      { id: 'integrations', title: 'Integrations', icon: Cable, path: '/gendox/integrations' },
      { id: 'tasks', title: 'Tasks', icon: ListChecks }
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
