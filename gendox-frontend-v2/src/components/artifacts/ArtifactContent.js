import Markdown from 'src/components/chat/Markdown'
import ArtifactFrame from 'src/components/artifacts/ArtifactFrame'
import { fencedCode, runsInFrame } from 'src/components/artifacts/artifactUtils'

/**
 * An artifact as it is meant to be seen: html and svg in the sealed frame; markdown and code with the chat's own
 * Markdown, which sanitizes what it renders as it does for answers. Only the frame runs code, so only it reports errors.
 *
 * @param artifact - artifactId, capabilities, organizationId and projectId, passed to the frame (gendox-core#600)
 */
const ArtifactContent = ({ kind, content, codeLanguage, title, fit, minHeight, maxHeight, onError, ...artifact }) => {
  if (runsInFrame(kind)) {
    return (
      <ArtifactFrame
        kind={kind}
        content={content}
        title={title}
        fit={fit}
        minHeight={minHeight}
        maxHeight={maxHeight}
        onError={onError}
        {...artifact}
      />
    )
  }
  if (kind === 'markdown') return <Markdown text={content} />

  return <Markdown text={fencedCode(content, codeLanguage)} />
}

export default ArtifactContent
