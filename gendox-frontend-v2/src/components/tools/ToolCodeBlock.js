export default function ToolCodeBlock({ children, output = false, ...props }) {
  return (
    <pre className={`client-command${output ? ' client-output' : ''}`} {...props}>
      {children}
    </pre>
  )
}
