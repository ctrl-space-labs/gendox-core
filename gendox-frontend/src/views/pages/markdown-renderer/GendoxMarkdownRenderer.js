// import ReactMarkdown from 'react-markdown';


// const GendoxMarkdownRenderer = ({ markdownText }) => {
//     return (
//         <div className="markdown-container">
//             <ReactMarkdown>{markdownText}</ReactMarkdown>
//         </div>
//     );
// };

// export default GendoxMarkdownRenderer;

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css"; // Import a highlight.js theme

import { Typography, Box, Link, List, ListItem, Divider } from "@mui/material";

/**
 * GendoxMarkdownRenderer renders markdown text using MUI components with customizable styles.
 *
 * Props:
 *   - markdownText (string): The markdown content to render.
 *   - sxOverrides (object, optional): An object to override the default sx styles for markdown elements.
 *     Each key should correspond to a markdown tag or "container" for the outer Box.
 *
 * Example usage:
 *
 * // Default rendering without any overrides:
 * <GendoxMarkdownRenderer markdownText={"# Hello World\nThis is a paragraph."} />
 *
 * // Overriding styles:
 * <GendoxMarkdownRenderer
 *   markdownText={"# Custom Title\nThis is a custom paragraph."}
 *   sxOverrides={{
 *     container: { fontSize: '0.9rem' },
 *     h1: { color: 'primary.main', mb: '1.5rem' },
 *     p: { mb: '1rem' },
 *   }}
 * />
 *
 * In the above example:
 *   - The container's font size is set to 0.9rem.
 *   - h1 elements will have the primary main color and a margin-bottom of 1.5rem.
 *   - Paragraphs (p) will have a margin-bottom of 1rem.
 */
const GendoxMarkdownRenderer = ({ markdownText, sxOverrides = {} }) => {
  // Helper function to merge default styles with any overrides for a given tag.
  const getSx = (tag, defaultSx = {}) => ({ ...defaultSx, ...(sxOverrides[tag] || {}) });

  return (
    <Box className="markdown-container" sx={getSx('container')}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={{
          // Paragraphs rendered with MUI Typography
          p: ({ node, children, ...props }) => (
            <Typography variant="body1" paragraph sx={getSx('p', { fontSize: 'inherit' })} {...props}>
              {children}
            </Typography>
          ),
          // Headings
          h1: ({ node, children, ...props }) => (
            <Typography variant="h4" gutterBottom sx={getSx('h1', { fontSize: 'inherit' })} {...props}>
              {children}
            </Typography>
          ),
          h2: ({ node, children, ...props }) => (
            <Typography variant="h5" gutterBottom sx={getSx('h2', { fontSize: 'inherit' })} {...props}>
              {children}
            </Typography>
          ),
          h3: ({ node, children, ...props }) => (
            <Typography variant="h6" gutterBottom sx={getSx('h3', { fontSize: 'inherit' })} {...props}>
              {children}
            </Typography>
          ),
          // Links rendered with MUI Link
          a: ({ node, children, ...props }) => (
            <Link {...props} target="_blank" rel="noopener" sx={getSx('a')}>
              {children}
            </Link>
          ),
          // Unordered list
          ul: ({ node, children, ...props }) => (
            <List sx={getSx('ul', { listStyleType: 'disc', pl: 2, fontSize: 'inherit' })} {...props}>
              {children}
            </List>
          ),
          // Ordered list
          ol: ({ node, children, ...props }) => (
            <List sx={getSx('ol', { listStyleType: 'decimal', pl: 2, fontSize: 'inherit' })} {...props}>
              {children}
            </List>
          ),
          // List items
          li: ({ node, children, ...props }) => (
            <ListItem sx={getSx('li', { display: 'list-item', py: 0, fontSize: 'inherit' })} {...props}>
              {children}
            </ListItem>
          ),
          // Blockquote styling
          blockquote: ({ node, children, ...props }) => (
            <Box
              component="blockquote"
              sx={getSx('blockquote', {
                borderLeft: '4px solid',
                borderColor: 'primary.main',
                pl: 2,
                fontStyle: 'italic',
                mb: 2,
                bgcolor: 'background.paper',
                fontSize: 'inherit',
              })}
              {...props}
            >
              {children}
            </Box>
          ),
          // Horizontal rule as MUI Divider
          hr: ({ node, ...props }) => (
            <Divider sx={getSx('hr', { my: 2 })} {...props} />
          ),
          // Images centered with responsive width
          img: ({ node, ...props }) => (
            <Box sx={getSx('img', { my: 2, textAlign: 'center', fontSize: 'inherit' })}>
              <img style={{ maxWidth: '100%' }} alt="" {...props} />
            </Box>
          ),
          // Code blocks and inline code styling
          code: ({ node, inline, className, children, ...props }) =>
            !inline ? (
              <Box
                component="pre"
                sx={getSx('codeBlock', {
                  backgroundColor: '#f6f8fa',
                  p: 1,
                  borderRadius: 1,
                  overflowX: 'auto',
                  fontSize: 'inherit',
                })}
              >
                <code className={className} {...props}>
                  {children}
                </code>
              </Box>
            ) : (
              <Box
                component="code"
                sx={getSx('code', {
                  backgroundColor: '#f6f8fa',
                  px: 0.5,
                  borderRadius: 1,
                  fontSize: 'inherit',
                })}
                {...props}
              >
                {children}
              </Box>
            ),
        }}
      >
        {markdownText}
      </ReactMarkdown>
    </Box>
  );
};


export default GendoxMarkdownRenderer;
