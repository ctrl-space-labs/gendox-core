export default function ToolCodeBlock({ children, output = false, directory, ...props }) {
  return (
    <pre className={`client-command client-terminal${output ? ' client-output' : ''}`} {...props}>
      {directory && <span className='client-cwd'>{directory}</span>}
      {!output && <span className='client-prompt' aria-hidden='true'>${' '}</span>}
      {children}
    </pre>
  )
}
