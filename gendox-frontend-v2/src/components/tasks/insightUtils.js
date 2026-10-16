import {
  CircleAlert,
  CircleCheck,
  CircleHelp,
  Info,
  OctagonAlert,
  Siren,
  TriangleAlert
} from 'lucide-react'

/**
 * The AI's review of its own answer (answerFlagEnum). An icon, never a status badge.
 * The order is the order of the legend and of a document's answer counts.
 */
export const FLAGS = {
  OK: { icon: CircleCheck, color: 'var(--ok)', text: 'Looks fine' },
  INFO: { icon: Info, color: 'var(--info)', text: 'Worth knowing' },
  WARNING: { icon: TriangleAlert, color: 'var(--warn)', text: 'Check this' },
  MINOR_ISSUE: { icon: CircleAlert, color: 'var(--warn)', text: 'Minor issue' },
  MAJOR_ISSUE: { icon: OctagonAlert, color: 'var(--err)', text: 'Major issue' },
  CRITICAL_ISSUE: { icon: Siren, color: 'var(--err)', text: 'Critical issue' },
  NA: { icon: CircleHelp, color: 'var(--text-3)', text: 'Not found in the document' }
}

export const ISSUE_FLAGS = ['WARNING', 'MINOR_ISSUE', 'MAJOR_ISSUE', 'CRITICAL_ISSUE']

export const Flag = ({ flag }) => {
  const f = FLAGS[flag]
  if (!f) return <span className='flag' />
  const Icon = f.icon

  return (
    <span className='flag' style={{ '--c': f.color }} title={f.text}>
      <Icon className='lucide' />
    </span>
  )
}

export const flagText = flag => FLAGS[flag]?.text ?? 'See the details'

/** How a question is answered: insightConfig.answerMode, and for a decision its kind */
export const KIND = {
  AUTO: 'AI decides',
  GENERATED_TEXT: 'Written',
  BOOLEAN: 'Yes / No',
  CHOICE: 'Choice',
  SCORE: 'Rating'
}

export const kindOf = question => {
  const config = question?.insightConfig ?? {}

  return config.answerMode === 'DECISION' ? config.decision?.kind ?? 'BOOLEAN' : config.answerMode ?? 'GENERATED_TEXT'
}

export const isDecision = question => question?.insightConfig?.answerMode === 'DECISION'

// ---------- nodes from the API, flattened ----------

export const documentOf = node => {
  const meta = node.nodeValue?.documentMetadata ?? {}

  return {
    id: node.id,
    documentId: node.documentId,
    name: meta.title || 'Untitled document',
    prompt: meta.prompt || '',
    supportingDocumentIds: meta.supportingDocumentIds || [],
    summary: meta.insightsSummary || null,
    createdAt: node.createdAt
  }
}

export const questionOf = node => ({
  id: node.id,
  text: node.nodeValue?.message || '',
  title: node.nodeValue?.questionTitle || '',
  order: node.nodeValue?.order ?? 0,
  supportingDocumentIds: node.nodeValue?.documentMetadata?.supportingDocumentIds || [],
  insightConfig: node.nodeValue?.insightConfig || { version: 1, answerMode: 'GENERATED_TEXT' }
})

export const answerOf = node => ({
  id: node.id,
  documentNodeId: node.nodeValue?.nodeDocumentId,
  questionNodeId: node.nodeValue?.nodeQuestionId,
  message: node.nodeValue?.message || '',
  value: node.nodeValue?.answerValue || '',
  flag: node.nodeValue?.answerFlagEnum || '',
  decision: node.nodeValue?.decisionResult || null,
  updatedAt: node.updatedAt ?? node.createdAt
})

export const questionLabel = question => question.title || question.text || 'Untitled question'

export const percent = value => (value == null ? null : Math.round(value * 100))

// ---------- question setup (insightConfig) ----------

export const DEFAULT_BOOLEAN = { true: 'The criteria are satisfied', false: 'The criteria are not satisfied' }

const defaultOptions = kind =>
  kind === 'SCORE'
    ? [
        { key: 'option_1', label: 'Low' },
        { key: 'option_2', label: 'Medium' },
        { key: 'option_3', label: 'High' }
      ]
    : [
        { key: 'option_1', label: 'Option 1' },
        { key: 'option_2', label: 'Option 2' }
      ]

export const nextOptionKey = options => {
  let index = options.length + 1
  while (options.some(option => option.key === `option_${index}`)) index += 1

  return `option_${index}`
}

/** The editable form of a question (or a blank one) */
export const questionForm = question => {
  const config = question?.insightConfig ?? { answerMode: 'AUTO' }
  const decision = config.decision
  const kind = decision?.kind ?? 'BOOLEAN'
  const options =
    kind === 'CHOICE'
      ? Object.entries(decision?.choices ?? {}).map(([key, label]) => ({ key, label }))
      : kind === 'SCORE'
      ? (decision?.scoreCriteria ?? []).map((label, index) => ({ key: `option_${index + 1}`, label }))
      : []

  return {
    title: question?.title ?? '',
    text: question?.text ?? '',
    mode: config.answerMode ?? 'AUTO',
    kind,
    booleanCriteria: { ...DEFAULT_BOOLEAN, ...(decision?.booleanCriteria ?? {}) },
    options: options.length >= 2 ? options : defaultOptions(kind),
    // an empty "how to decide" is saved as the question itself
    instructions: decision?.instructions && decision.instructions !== question?.text ? decision.instructions : '',
    supportingDocumentIds: question?.supportingDocumentIds ?? [],
    sourceQuestion: config.sourceQuestion ?? ''
  }
}

export const withKind = (form, kind) => ({
  ...form,
  kind,
  options: form.kind === kind || (form.kind !== 'BOOLEAN' && kind !== 'BOOLEAN') ? form.options : defaultOptions(kind)
})

export const questionProblem = form => {
  if (!form.text.trim()) return 'Write the question.'
  if (form.mode !== 'DECISION') return null
  if (form.kind === 'BOOLEAN') {
    return form.booleanCriteria.true.trim() && form.booleanCriteria.false.trim() ? null : 'Say what Yes and No mean.'
  }
  if (form.options.length < 2 || form.options.some(o => !o.label.trim())) return 'Name at least two options.'
  if (form.kind === 'SCORE' && form.options.length > 10) return 'A rating has up to ten levels.'
  if (form.kind === 'CHOICE') {
    const keys = form.options.map(o => o.key.trim())
    if (keys.some(k => !k) || new Set(keys).size !== keys.length) return 'Every choice needs its own key.'
  }

  return null
}

export const insightConfigOf = form => {
  if (form.mode !== 'DECISION') return { version: 1, answerMode: form.mode }
  const decision = {
    kind: form.kind,
    instructions: form.instructions.trim() || form.text.trim(),
    booleanCriteria: {},
    choices: {},
    scoreCriteria: []
  }
  if (form.kind === 'BOOLEAN') decision.booleanCriteria = form.booleanCriteria
  else if (form.kind === 'CHOICE') decision.choices = Object.fromEntries(form.options.map(o => [o.key.trim(), o.label.trim()]))
  else decision.scoreCriteria = form.options.map(o => o.label.trim())

  return { version: 1, answerMode: 'DECISION', decision, ...(form.sourceQuestion ? { sourceQuestion: form.sourceQuestion } : {}) }
}

/** Whether saving this form changes how the column is answered, which deletes its answers */
export const questionChanged = (question, form) => {
  const before = questionForm(question)

  return (
    before.text !== form.text ||
    JSON.stringify(insightConfigOf(before)) !== JSON.stringify(insightConfigOf(form)) ||
    JSON.stringify(before.supportingDocumentIds) !== JSON.stringify(form.supportingDocumentIds)
  )
}
