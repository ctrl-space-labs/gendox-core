import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import rehypeHighlight from "rehype-highlight"
import "highlight.js/styles/github.css"

interface GendoxMarkdownRendererProps {
  markdownText: string
  classNameOverrides?: Record<string, string>
}

const GendoxMarkdownRenderer = ({
  markdownText,
  classNameOverrides = {},
}: GendoxMarkdownRendererProps) => {
  const getCn = (tag: string, defaultCn = "") =>
    classNameOverrides[tag] || defaultCn

  return (
    <div className={`markdown-container ${getCn("container")}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={{
          p: ({ node, children, ...props }: any) => (
            <p
              className={getCn("p", "text-base mb-4 [font-size:inherit]")}
              {...props}
            >
              {children}
            </p>
          ),
          h1: ({ node, children, ...props }: any) => (
            <h1
              className={getCn(
                "h1",
                "text-2xl font-bold mb-4 [font-size:inherit]"
              )}
              {...props}
            >
              {children}
            </h1>
          ),
          h2: ({ node, children, ...props }: any) => (
            <h2
              className={getCn(
                "h2",
                "text-xl font-bold mb-3 [font-size:inherit]"
              )}
              {...props}
            >
              {children}
            </h2>
          ),
          h3: ({ node, children, ...props }: any) => (
            <h3
              className={getCn(
                "h3",
                "text-lg font-bold mb-2 [font-size:inherit]"
              )}
              {...props}
            >
              {children}
            </h3>
          ),
          a: ({ node, children, ...props }: any) => (
            <a
              className={getCn("a", "text-primary underline")}
              target="_blank"
              rel="noopener"
              {...props}
            >
              {children}
            </a>
          ),
          ul: ({ node, children, ...props }: any) => (
            <ul
              className={getCn(
                "ul",
                "list-disc pl-6 [font-size:inherit]"
              )}
              {...props}
            >
              {children}
            </ul>
          ),
          ol: ({ node, children, ...props }: any) => (
            <ol
              className={getCn(
                "ol",
                "list-decimal pl-6 [font-size:inherit]"
              )}
              {...props}
            >
              {children}
            </ol>
          ),
          li: ({ node, children, ...props }: any) => (
            <li
              className={getCn("li", "py-0 [font-size:inherit]")}
              {...props}
            >
              {children}
            </li>
          ),
          blockquote: ({ node, children, ...props }: any) => (
            <blockquote
              className={getCn(
                "blockquote",
                "border-l-4 border-primary pl-4 italic mb-4 bg-card [font-size:inherit]"
              )}
              {...props}
            >
              {children}
            </blockquote>
          ),
          hr: ({ node, ...props }: any) => (
            <hr className={getCn("hr", "my-4 border-border")} {...props} />
          ),
          img: ({ node, ...props }: any) => (
            <span
              className={getCn(
                "img",
                "my-4 text-center block [font-size:inherit]"
              )}
            >
              <img className="max-w-full" alt="" {...props} />
            </span>
          ),
          code: ({ node, inline, className, children, ...props }: any) =>
            !inline ? (
              <pre
                className={getCn(
                  "codeBlock",
                  "bg-muted p-2 rounded overflow-x-auto [font-size:inherit]"
                )}
              >
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code
                className={getCn(
                  "code",
                  "bg-muted px-1 rounded [font-size:inherit]"
                )}
                {...props}
              >
                {children}
              </code>
            ),
        }}
      >
        {markdownText}
      </ReactMarkdown>
    </div>
  )
}

export default GendoxMarkdownRenderer
