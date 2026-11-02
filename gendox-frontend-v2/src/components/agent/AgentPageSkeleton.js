import AgentScope from 'src/components/agent/AgentScope'

/**
 * An agent's settings page while the agent loads: its header and tabs are known from the profile, and the page's
 * title line and body show as shimmering bars in their place.
 * @param tab - the settings tab to highlight
 * @param children - the body's shape; a card with two rows by default
 */
const AgentPageSkeleton = ({ tab, children }) => (
  <main className='content' aria-busy='true'>
    <AgentScope tab={tab} />
    <div className='list-h'>
      <div style={{ flex: 1 }}>
        <span className='skel' style={{ display: 'block', width: 120, height: 18 }} />
        <span className='skel' style={{ display: 'block', width: '70%', marginTop: 10 }} />
      </div>
    </div>
    {children ?? (
      <div className='stack'>
        {[0, 1].map(i => (
          <div key={i} className='card card-b row' style={{ gap: 14 }}>
            <span className='skel' style={{ width: 34, height: 34, borderRadius: 8 }} />
            <div style={{ flex: 1 }}>
              <span className='skel' style={{ display: 'block', width: 160 }} />
              <span className='skel' style={{ display: 'block', width: '55%', marginTop: 8 }} />
            </div>
          </div>
        ))}
      </div>
    )}
  </main>
)

export default AgentPageSkeleton
