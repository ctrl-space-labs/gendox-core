import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import documentService from 'src/gendox-sdk/documentService'
import { downloadFromAxiosResponse } from 'src/utils/downloadFileUtils'
import { toMessageAttachmentUI } from 'src/utils/attachmentsAdapter'
import FileTile from 'src/components/ui/FileTile'
import { displayFileName } from 'src/components/chat/chatUtils'

/**
 * The files sent with a message: images as previews that open full size, other files as tiles that download.
 */
const ChatAttachments = ({ attachments, threadId, token }) => {
  const [activeImage, setActiveImage] = useState(null)

  const items = useMemo(
    () => (Array.isArray(attachments) ? attachments.map(doc => toMessageAttachmentUI(doc)) : []),
    [attachments]
  )
  const images = items.filter(a => a.kind === 'image')
  const files = items.filter(a => a.kind !== 'image')

  useEffect(() => {
    if (!activeImage) return
    const onKeyDown = e => e.key === 'Escape' && setActiveImage(null)
    window.addEventListener('keydown', onKeyDown)

    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeImage])

  const download = async file => {
    if (!file?.documentId) return
    try {
      const res = await documentService.downloadDocument(threadId, file.documentId, token)
      downloadFromAxiosResponse(res, displayFileName(file.title) || 'document')
    } catch (e) {
      console.error('Download failed:', e)
      toast.error('Failed to download file')
    }
  }

  if (items.length === 0) return null

  return (
    <>
      {images.length > 0 && (
        <div className='gc-images'>
          {images.map(image =>
            image.previewUrl ? (
              <img
                key={image.id}
                src={image.previewUrl}
                alt={image.title}
                onClick={() => setActiveImage(image)}
              />
            ) : (
              <span key={image.id} className='ph' />
            )
          )}
        </div>
      )}
      {files.length > 0 && (
        <div className='gc-files'>
          {files.map(file => (
            <span
              key={file.id}
              className='gc-file'
              role='button'
              tabIndex={0}
              title={`Download ${displayFileName(file.title)}`}
              onClick={() => download(file)}
              onKeyDown={e => e.key === 'Enter' && download(file)}
            >
              <FileTile name={file.title} />
              <span style={{ minWidth: 0 }}>
                <span className='trunc' style={{ display: 'block' }}>
                  {displayFileName(file.title)}
                </span>
                <span className='faint sm'>{file.documentType || 'File'}</span>
              </span>
            </span>
          ))}
        </div>
      )}
      {activeImage &&
        createPortal(
          <div className='lightbox' onClick={() => setActiveImage(null)}>
            <img src={activeImage.previewUrl} alt={activeImage.title} />
          </div>,
          document.body
        )}
    </>
  )
}

export default ChatAttachments
