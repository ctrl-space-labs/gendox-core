import ReactMarkdown from 'react-markdown';


const GendoxMarkdownRenderer = ({ markdownText }) => {
    return (
        <div className="markdown-container">
            <ReactMarkdown>{markdownText}</ReactMarkdown>
        </div>
    );
};

export default GendoxMarkdownRenderer;


// import ReactMarkdown from 'react-markdown';
// import { Typography, Box, Link, List, ListItem, Divider } from '@mui/material';

// const GendoxMarkdownRenderer = ({ markdownText }) => {
//     return (
//         <Box className="markdown-container">
//             <ReactMarkdown
//                 components={{
//                     p: ({ node, children, ...props }) => {
//                         // Avoid wrapping block elements like images and blockquotes inside <p>
//                         const hasBlockChild = node.children.some(child => ['image', 'blockquote'].includes(child.tagName));
//                         if (hasBlockChild) {
//                             return <>{children}</>; // Render without wrapping
//                         }
//                         return <Typography variant="body1" gutterBottom {...props}>{children}</Typography>;
//                     },
//                     h1: ({ node, ...props }) => <Typography variant="h4" component="h1" gutterBottom {...props} />,
//                     h2: ({ node, ...props }) => <Typography variant="h5" component="h2" gutterBottom {...props} />,
//                     h3: ({ node, ...props }) => <Typography variant="h6" component="h3" gutterBottom {...props} />,
//                     h4: ({ node, ...props }) => <Typography variant="subtitle1" component="h4" gutterBottom {...props} />,
//                     h5: ({ node, ...props }) => <Typography variant="subtitle2" component="h5" gutterBottom {...props} />,
//                     h6: ({ node, ...props }) => <Typography variant="body1" component="h6" gutterBottom {...props} />,
//                     a: ({ node, ...props }) => <Link {...props} />,
//                     ul: ({ node, ...props }) => <List sx={{ listStyleType: 'disc', pl: 4 }} {...props} />,
//                     ol: ({ node, ...props }) => <List sx={{ listStyleType: 'decimal', pl: 4 }} {...props} />,
//                     li: ({ node, ...props }) => <ListItem sx={{ display: 'list-item', pl: 2 }} {...props} />,
//                     blockquote: ({ node, ...props }) => (
//                         <Box
//                             component="blockquote"
//                             sx={{
//                                 borderLeft: '4px solid',
//                                 borderColor: 'primary.main',
//                                 pl: 2,
//                                 ml: 0,
//                                 color: 'text.secondary',
//                                 fontStyle: 'italic',
//                             }}
//                             {...props}
//                         />
//                     ),
//                     hr: ({ node, ...props }) => <Divider sx={{ my: 2 }} {...props} />,
//                     img: ({ node, ...props }) => (
//                         <Box sx={{ my: 2, textAlign: 'center' }}>
//                             <img style={{ maxWidth: '100%' }} {...props} />
//                         </Box>
//                     ),
//                     code: ({ node, inline, className, children, ...props }) => (
//                         <Box
//                             component="code"
//                             sx={{
//                                 fontFamily: 'monospace',
//                                 backgroundColor: inline ? 'background.paper' : 'background.default',
//                                 padding: inline ? '0 4px' : '16px',
//                                 borderRadius: 1,
//                                 overflowX: 'auto',
//                                 display: inline ? 'inline' : 'block',
//                                 whiteSpace: inline ? 'pre-wrap' : 'pre',
//                             }}
//                             {...props}
//                         >
//                             {children}
//                         </Box>
//                     ),
//                     pre: ({ node, ...props }) => (
//                         <Box
//                             component="pre"
//                             sx={{
//                                 fontFamily: 'monospace',
//                                 backgroundColor: 'background.default',
//                                 padding: 2,
//                                 borderRadius: 1,
//                                 overflowX: 'auto',
//                             }}
//                             {...props}
//                         />
//                     ),
//                 }}
//             >
//                 {markdownText}
//             </ReactMarkdown>
//         </Box>
//     );
// };

// export default GendoxMarkdownRenderer;

