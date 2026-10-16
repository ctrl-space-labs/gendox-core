import { Toaster, resolveValue } from 'react-hot-toast'
import { CircleAlert, CircleCheck } from 'lucide-react'

// Every toast() call in the app renders as the design's .toast
const Toasts = () => {
  return (
    <Toaster position='top-right' containerStyle={{ top: 16, right: 16 }} gutter={8}>
      {t => (
        <div className={`toast ${t.type === 'error' ? 'err' : 'ok'} ${t.visible ? '' : 'out'}`}>
          {t.type === 'error' ? <CircleAlert className='lucide' /> : <CircleCheck className='lucide' />}
          <span>{resolveValue(t.message, t)}</span>
        </div>
      )}
    </Toaster>
  )
}

export default Toasts
