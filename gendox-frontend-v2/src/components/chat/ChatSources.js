import { ArrowUpRight, BookOpen, ChevronRight, Library } from 'lucide-react'
import Spinner from 'src/components/ui/Spinner'
import FileTile from 'src/components/ui/FileTile'

// the splitter names untitled sections "Default Title"
const sectionTitleOf = source => (source.sectionTitle === 'Default Title' ? null : source.sectionTitle)

const Source = ({ source, documentHref }) => {
  const sectionTitle = sectionTitleOf(source)
  const href = source.externalUrl || (documentHref ? documentHref(source) : null)
  const Tag = href ? 'a' : 'div'
  const linkProps = href ? { href, target: '_blank', rel: 'noopener noreferrer' } : {}

  return (
    <Tag className='src' {...linkProps} title={sectionTitle || undefined}>
      <FileTile name={source.documentUrl || source.documentTitle || ''} type={source.externalUrl ? 'web' : undefined} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <b className='trunc' style={{ display: 'block', fontWeight: 500 }}>
          {source.documentTitle}
        </b>
        {(sectionTitle || source.externalUrl) && (
          <span className='faint sm'>
            {[sectionTitle, source.externalUrl?.replace(/^https?:\/\//, '')].filter(Boolean).join(' · ')}
          </span>
        )}
        {source.sectionValue && <q className='clamp3'>{source.sectionValue}</q>}
      </div>
      {href && (source.externalUrl ? <ArrowUpRight className='lucide' /> : <ChevronRight className='lucide' />)}
    </Tag>
  )
}

/**
 * The sources of one answer: the passages the agent used, then the ones it found but did not use.
 * @param metadata - GET threads/{t}/message-metadata/{m}
 * @param documentHref - (source) => link to the document inside the app; without it, documents show as quotes
 */
const ChatSources = ({ isLoading, metadata, documentHref }) => {
  if (isLoading) {
    return (
      <div className='gc-loading' style={{ padding: 32 }}>
        <Spinner />
      </div>
    )
  }

  const sources = Array.isArray(metadata) ? metadata : []
  const used = sources.filter(item => item.isCompletionParticipant)
  const more = sources.filter(item => !item.isCompletionParticipant)

  if (sources.length === 0) {
    return <p className='muted sm'>This answer has no sources.</p>
  }

  return (
    <>
      {used.length > 0 && (
        <>
          <div className='label'>
            <BookOpen className='lucide' />
            Used in this answer · {used.length}
          </div>
          <div className='src-list'>
            {used.map((source, index) => (
              <Source key={`used-${index}`} source={source} documentHref={documentHref} />
            ))}
          </div>
        </>
      )}
      {more.length > 0 && (
        <>
          <div
            className='label'
            style={{ marginTop: used.length > 0 ? 16 : 0 }}
            title='Relevant passages the agent found but did not use'
          >
            <Library className='lucide' />
            Also relevant · {more.length}
          </div>
          <div className='src-list dim'>
            {more.map((source, index) => (
              <Source key={`more-${index}`} source={source} documentHref={documentHref} />
            ))}
          </div>
        </>
      )}
    </>
  )
}

export default ChatSources
