import Dialog from 'src/components/ui/Dialog'

const ConfirmDialog = ({ open, onClose, onConfirm, title, text, confirmLabel = 'Delete', danger = true }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      size='s'
      footer={
        <>
          <button className='btn' onClick={onClose}>
            Cancel
          </button>
          <button
            className={`btn ${danger ? 'danger-solid' : 'primary'}`}
            onClick={() => {
              onClose()
              onConfirm()
            }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className='muted' style={{ lineHeight: 1.6 }}>
        {text}
      </p>
    </Dialog>
  )
}

export default ConfirmDialog
