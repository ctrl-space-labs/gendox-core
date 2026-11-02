import { useState } from 'react'
import { Check, Plus, Sparkles } from 'lucide-react'
import Dialog from 'src/components/ui/Dialog'
import Spinner from 'src/components/ui/Spinner'
import SkillTools from 'src/components/skills/SkillTools'
import { parseSkill } from 'src/utils/skillMarkdown'

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
        <div className='skill-lib'>
          {library.map(skill => {
            const added = addedNames.has(skill.name)

            return (
              <div key={skill.id} className='card'>
                <div className='row' style={{ gap: 10 }}>
                  <span className='ftype' style={{ '--h': 165, width: 28, height: 28 }}>
                    <Sparkles className='lucide' />
                  </span>
                  <b className='trunc' style={{ flex: 1 }}>
                    {skill.name}
                  </b>
                  <span className='faint sm'>v{skill.version}</span>
                </div>
                <p>{skill.description}</p>
                <SkillTools tools={parseSkill(skill.content).tools} />
                <button
                  aria-busy={adding === skill.name}
                  className='btn s'
                  style={{ alignSelf: 'flex-start' }}
                  disabled={added}
                  onClick={() => add(skill)}
                >
                  {added ? <Check className='lucide' /> : <Plus className='lucide' />}
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
