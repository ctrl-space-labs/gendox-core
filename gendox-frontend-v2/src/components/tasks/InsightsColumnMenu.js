import { ArrowDown, ArrowUp, Check, ChevronDown, ListFilter, X } from 'lucide-react'
import Menu from 'src/components/ui/Menu'
import { FLAGS, Flag, isDecision } from 'src/components/tasks/insightUtils'

// TaskNodeCriteria.UNANSWERED: documents with no answer to the question
export const UNANSWERED = 'UNANSWERED'

/** What a question's column can be filtered by: the AI's flags, or for a decision its options (the stored answerValue) */
export const filterOptionsOf = question => {
  if (!isDecision(question)) {
    return [
      { value: UNANSWERED, label: 'Not answered' },
      ...Object.keys(FLAGS).map(flag => ({ value: flag, label: FLAGS[flag].text, flag }))
    ]
  }
  const decision = question.insightConfig.decision ?? {}
  const values =
    decision.kind === 'CHOICE'
      ? Object.values(decision.choices ?? {})
      : decision.kind === 'SCORE'
      ? decision.scoreCriteria ?? []
      : ['Yes', 'No']

  return [
    { value: UNANSWERED, label: 'Not answered' },
    ...values.filter(Boolean).map(value => ({ value, label: value }))
  ]
}

/**
 * The table's sort and filter, as POST …/task-nodes/search criteria and sort. One sort and one filtered column at a time.
 * @param sort - { by: 'title' | 'answer', qId, dir: 'asc' | 'desc' } or null for the newest documents first
 * @param filter - { qId, values, negate } or null
 */
export const toDocumentSearch = (sort, filter, questions) => {
  const criteria = {}
  let order = 'createdAt,desc'
  if (sort?.by === 'title') order = `title,${sort.dir}`
  if (sort?.by === 'answer') {
    order = `answer,${sort.dir}`
    criteria.sortQuestionNodeId = sort.qId
  }
  const question = filter && questions.find(q => q.id === filter.qId)
  if (question && filter.values.length) {
    criteria.answerFilterQuestionNodeId = question.id
    if (isDecision(question)) {
      criteria.answerFilterValues = filter.values
      // a rating is stored with its reason, e.g. "High (…)"
      criteria.answerFilterValuePrefix = question.insightConfig.decision?.kind === 'SCORE'
    } else {
      criteria.answerFilterStatuses = filter.values
    }
    criteria.answerFilterNegate = !!filter.negate
  }

  return { criteria, sort: order }
}

/**
 * The menu at the end of a column header: sort the documents, and for a question filter them by its answer.
 * @param question - null for the Document column, which sorts by name only
 */
const InsightsColumnMenu = ({ question, sort, filter, onSort, onFilter }) => {
  const sortedHere = question ? sort?.by === 'answer' && sort.qId === question.id : sort?.by === 'title'
  const filteredHere = !!question && filter?.qId === question.id && filter.values.length > 0
  const values = filteredHere ? filter.values : []
  const SortIcon = sortedHere ? (sort.dir === 'asc' ? ArrowUp : ArrowDown) : null

  const sortBy = dir =>
    onSort(
      sortedHere && sort.dir === dir ? null : question ? { by: 'answer', qId: question.id, dir } : { by: 'title', dir }
    )

  const toggle = value => {
    const next = values.includes(value) ? values.filter(v => v !== value) : [...values, value]
    onFilter(next.length ? { qId: question.id, values: next, negate: filteredHere && filter.negate } : null)
  }

  return (
    <Menu
      align='right'
      width={250}
      trigger={({ onClick, open }) => (
        <button
          className={`qm ${sortedHere || filteredHere ? 'active' : ''}`}
          title={question ? 'Sort and filter' : 'Sort'}
          aria-label={question ? 'Sort and filter' : 'Sort'}
          aria-expanded={open}
          onClick={onClick}
        >
          {filteredHere && <ListFilter className='lucide' />}
          {SortIcon && <SortIcon className='lucide' />}
          {!filteredHere && !SortIcon && <ChevronDown className='lucide' />}
        </button>
      )}
    >
      <div className='h'>Sort</div>
      <button className='mi' data-close-menu onClick={() => sortBy('asc')}>
        <ArrowUp className='lucide' />
        <span className='sp'>{question ? 'Ascending' : 'Name, A to Z'}</span>
        {sortedHere && sort.dir === 'asc' && <Check className='lucide' />}
      </button>
      <button className='mi' data-close-menu onClick={() => sortBy('desc')}>
        <ArrowDown className='lucide' />
        <span className='sp'>{question ? 'Descending' : 'Name, Z to A'}</span>
        {sortedHere && sort.dir === 'desc' && <Check className='lucide' />}
      </button>
      {question && (
        <>
          <hr />
          <div className='h'>Show documents whose answer is</div>
          {filterOptionsOf(question).map(option => (
            <label key={option.value} className='mi'>
              <input type='checkbox' checked={values.includes(option.value)} onChange={() => toggle(option.value)} />
              {option.flag && <Flag flag={option.flag} />}
              <span className='trunc'>{option.label}</span>
            </label>
          ))}
          {filteredHere && (
            <>
              <label className='mi'>
                <input
                  type='checkbox'
                  checked={!!filter.negate}
                  onChange={e => onFilter({ ...filter, negate: e.target.checked })}
                />
                <span>Anything but these</span>
              </label>
              <hr />
              <button className='mi' data-close-menu onClick={() => onFilter(null)}>
                <X className='lucide' />
                Clear the filter
              </button>
            </>
          )}
        </>
      )}
    </Menu>
  )
}

export default InsightsColumnMenu
