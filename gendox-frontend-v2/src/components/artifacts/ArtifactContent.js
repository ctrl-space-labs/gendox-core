import Markdown from 'src/components/chat/Markdown'
import ArtifactFrame from 'src/components/artifacts/ArtifactFrame'
import { fencedCode, runsInFrame } from 'src/components/artifacts/artifactUtils'

/**
 * An artifact as it is meant to be seen: html and svg in the sealed frame; markdown and code with the chat's own
 * Markdown, which sanitizes what it renders as it does for answers.
 */
const ArtifactContent = ({ kind, content, codeLanguage, title, fit, maxHeight }) => {
  if (runsInFrame(kind)) return <ArtifactFrame kind={kind} content={content} title={title} fit={fit} maxHeight={maxHeight} />
  if (kind === 'markdown') return <Markdown text={content} />

  return <Markdown text={fencedCode(content, codeLanguage)} />
}

export default ArtifactContent
