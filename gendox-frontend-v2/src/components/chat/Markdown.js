import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeRaw from 'rehype-raw'
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
  )
}

const Markdown = ({ text, className = 'gc-md' }) => {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex, rehypeHighlight]}
        components={components}
      >
        {normalizeMathDelimiters(text)}
      </ReactMarkdown>
    </div>
  )
}

export default Markdown
