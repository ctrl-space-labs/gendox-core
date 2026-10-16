import { Earth, ListChecks, ScanText, Table2 } from 'lucide-react'

/** The kinds of task, in the order they are offered. `path` is the page that opens one. */
export const TASK_TYPES = {
  DOCUMENT_INSIGHTS: {
    title: 'Document insights',
    text: 'Ask the same questions of many documents and get a table of answers',
    icon: Table2,
    hue: 160,
    path: '/gendox/tasks/document-insights'
  },
  DOCUMENT_DIGITIZATION: {
    title: 'Digitization',
    text: 'Turn scanned documents into text, page by page',
    icon: ScanText,
    hue: 25,
    path: '/gendox/tasks/document-digitization'
  },
  EARTH_OBSERVATION: {
    title: 'Earth observation',
    text: 'Analyse satellite imagery with Google Earth Engine and an AI assistant',
    icon: Earth,
    hue: 205,
    path: '/gendox/tasks/earth-observation/workspace'
  }
}

const UNKNOWN = { title: 'Task', text: '', icon: ListChecks, hue: 260, path: null }

/** A task's type name: the API returns `taskType: { name }`, a payload carries `type` */
export const taskTypeOf = task => task?.taskType?.name ?? task?.taskType?.value ?? task?.type ?? ''

export const typeOfTask = task => TASK_TYPES[taskTypeOf(task)] ?? UNKNOWN

export const TaskTile = ({ task, type, className = '' }) => {
  const { icon: Icon, hue } = type ? TASK_TYPES[type] ?? UNKNOWN : typeOfTask(task)

  return (
    <span className={`ftype ${className}`} style={{ '--h': hue }}>
      <Icon className='lucide' />
    </span>
  )
}
