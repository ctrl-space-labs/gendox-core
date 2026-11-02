import { Wrench } from 'lucide-react'

/**
 * The tools a skill brings (allowed-tools in its SKILL.md), as badges. The agent has them while it has the skill.
 * @param tools - tool names
 * @param descriptions - optional Map name → description, shown on hover
 */
const SkillTools = ({ tools, descriptions }) =>
  tools?.length ? (
    <div className='row' style={{ gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
      <span className='faint sm'>Brings</span>
      {tools.map(name => (
        <span key={name} className='badge mono' title={descriptions?.get(name)}>
          <Wrench className='lucide' />
          {name}
        </span>
      ))}
    </div>
  ) : null

export default SkillTools
