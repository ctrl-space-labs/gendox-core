// Mutable ref shared between EditorPanel (writer) and ChatPanel (reader).
// Using a plain object avoids Redux dispatch overhead on every keystroke while
// still giving ChatPanel access to the live, unsaved script content.
export const editorCodeRef = { current: '' }

// Shared trigger so tool handlers (EditorPanel) can fire GeeRunner's run()
// without prop drilling or forwardRef. GeeRunner sets this on mount.
export const runScriptRef = { current: null }

// Shared handle so ChatPanel can programmatically accept pending AI edits
// (e.g. auto-keep before capturing the script as local context).
// EditorPanel keeps this pointing to its handleKeepAll on every render.
export const keepAllRef = { current: null }
