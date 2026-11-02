import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import Dialog from 'src/components/ui/Dialog'
import Spinner from 'src/components/ui/Spinner'

/**
 * "Skills from Gendox": the library an agent adds skills from.
 * @param onAdd - (skill) => Promise; the skill is added once it resolves
 */
const SkillLibraryDialog = ({ open, library, loading, addedNames, onAdd, onClose }) => {
  const [adding, setAdding] = useState(null)

  const add = async skill => {
    setAdding(skill.name)
    try {
      await onAdd(skill)
    } finally {
      setAdding(null)
    }
  }

  return (
    <Dialog
      busy={Boolean(adding)}
      open={open}
      onClose={onClose}
      size='l'
      title='Skills from Gendox'
      subtitle='Ready-made skills, kept up to date by Gendox. Add the ones this agent needs.'
      footer={
        <button className='btn' onClick={onClose}>
          Done
        </button>
      }
    >
      {loading && !library.length ? (
        <div className='center' style={{ minHeight: 0, padding: 32 }}>
          <Spinner />
        </div>
      ) : library.length === 0 ? (
        <p className='faint sm' style={{ padding: '24px 0', textAlign: 'center' }}>
          No Gendox skills yet.
        </p>
      ) : (
        <div className='stack' style={{ gap: 8 }}>
          {library.map(skill => {
            const added = addedNames.has(skill.name)

            return (
              <div key={skill.id} className='card card-b row' style={{ gap: 12, alignItems: 'flex-start' }}>
                <span className='ftype' style={{ '--h': 265 }}>
                  <Sparkles className='lucide' />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className='row'>
                    <b className='mono'>{skill.name}</b>
                    <span className='faint sm'>v{skill.version}</span>
                  </div>
                  <p className='muted sm' style={{ marginTop: 2 }}>
                    {skill.description}
                  </p>
                </div>
                <button
                  aria-busy={adding === skill.name}
                  className={`btn s ${added ? 'ghost' : ''}`}
                  disabled={added}
                  onClick={() => add(skill)}
                >
                  {added ? 'Added' : 'Add'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </Dialog>
  )
}

export default SkillLibraryDialog
