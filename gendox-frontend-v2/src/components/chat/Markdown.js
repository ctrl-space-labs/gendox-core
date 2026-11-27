import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import rehypeHighlight from 'rehype-highlight'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

/**
 * remark-math only recognises $...$ and $$...$$, but LLMs emit LaTeX delimiters
 * (\[...\] for display, \(...\) for inline). Without this they render literally.
 *
 * Fenced code is left untouched so a snippet showing these delimiters stays intact.
 */
const normalizeMathDelimiters = text => {
  if (!text) return text

  return text
    .split(/(```[\s\S]*?```|`[^`\n]*`)/g)
    .map((segment, index) => {
      // Odd indices are the captured code segments.
      if (index % 2 === 1) return segment

      return segment
        .replace(/\\\[([\s\S]*?)\\\]/g, (_, body) => `$$${body.trim()}$$`)
        .replace(/\\\(([\s\S]*?)\\\)/g, (_, body) => `$${body.trim()}$`)
    })
    .join('')
}

const components = {
  a: ({ node, children, ...props }) => (
    <a {...props} target='_blank' rel='noopener'>
      {children}
    </a>
  ),
  // wide tables scroll inside their own box, not the whole chat
  table: ({ node, ...props }) => (
    <div className='gc-table' tabIndex={0}>
      <table {...props} />
    </div>
  ),
  // a cell is as wide as its text, up to a cap, so long text wraps at a readable width
  th: ({ node, children, ...props }) => (
    <th {...props}>
      <div className='gc-cell'>{children}</div>
    </th>
  ),
  td: ({ node, children, ...props }) => (
    <td {...props}>
      <div className='gc-cell'>{children}</div>
    </td>
  )
}

// the address as the browser would load it: also one with no scheme (//host/x.png) or a relative one; null if none
const resolved = src => {
  try {
    return new URL(src, typeof window === 'undefined' ? 'http://localhost/' : window.location.href)
  } catch (_) {
    return null
  }
}

// Only an image carried in the text itself (data:) loads. Any other becomes a link the reader may follow - on another
// server, with no scheme, or relative - so opening the text fetches nothing: it tells no server who read it or when,
// and carries nothing out in an image's address. <source> (and its srcSet) is dropped, and <picture> keeps only its
// <img>, which goes through the same rule.
const withoutExternalImages = {
  ...components,
  img: ({ node, src = '', alt = '', ...props }) => {
    // no address left (the sanitizer drops a data: one): only its description, never a link to this page
    if (!src) return <span className='md-img-link'>🖼 {alt || 'Image'}</span>
    const url = resolved(src)
    if (url && url.protocol === 'data:') return <img src={src} alt={alt} {...props} />
    if (!url || !/^https?:$/.test(url.protocol)) return <span className='md-img-link'>🖼 {alt || 'Image'}</span>

    return (
      <a href={url.href} target='_blank' rel='noopener noreferrer' className='md-img-link'>
        🖼 {alt || 'Image'} ({url.host})
      </a>
    )
  },
  source: () => null,
  picture: ({ node, children }) => <>{children}</>
}

/**
 * @param externalImages - false to show an image on another server as a link instead of loading it (gendox-core#570):
 *   for text the reader did not write and may open without asking, such as an artifact
 */
const Markdown = ({ text, className = 'gc-md', externalImages = true }) => {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeKatex, rehypeHighlight]}
        components={externalImages ? components : withoutExternalImages}
      >
        {normalizeMathDelimiters(text)}
      </ReactMarkdown>
    </div>
  )
}

export default Markdown
