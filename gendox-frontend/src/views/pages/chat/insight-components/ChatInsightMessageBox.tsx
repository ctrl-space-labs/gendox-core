import { useSelector } from "react-redux"

const ChatInsightMessageBox = () => {
  const { currentMessageMetadata } = useSelector(
    (state: any) => state.gendoxChat
  )

  return (
    <div className="p-2">
      {!currentMessageMetadata ? (
        <div className="flex justify-center items-center h-full">
          <p className="text-sm text-muted-foreground">No chat selected.</p>
        </div>
      ) : (
        <p className="text-sm mb-2 line-clamp-3">
          <strong>Message:</strong>{" "}
          {currentMessageMetadata.message?.message}
        </p>
      )}
    </div>
  )
}

export default ChatInsightMessageBox
