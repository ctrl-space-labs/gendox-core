// Mutable ref shared between EditorPanel (writer) and ChatPanel (reader).
// Using a plain object avoids Redux dispatch overhead on every keystroke while
// still giving ChatPanel access to the live, unsaved script content.
export const editorCodeRef = { current: '' }
