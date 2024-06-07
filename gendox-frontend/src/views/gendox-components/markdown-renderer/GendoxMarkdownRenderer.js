import ReactMarkdown from 'react-markdown';


const GendoxMarkdownRenderer = ({ markdownText }) => {
    return (
        <div className="markdown-container">
            <ReactMarkdown>{markdownText}</ReactMarkdown>
        </div>
    );
};

export default GendoxMarkdownRenderer;
