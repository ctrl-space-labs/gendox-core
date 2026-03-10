// Mutable ref shared between EditorPanel (writer) and ChatPanel (reader).
// Using a plain object avoids Redux dispatch overhead on every keystroke while
// still giving ChatPanel access to the live, unsaved script content.
export const editorCodeRef = { current: '' }

// Shared trigger so tool handlers (EditorPanel) can fire GeeRunner's run()
// without prop drilling or forwardRef. GeeRunner sets this on mount.
export const runScriptRef = { current: null }
