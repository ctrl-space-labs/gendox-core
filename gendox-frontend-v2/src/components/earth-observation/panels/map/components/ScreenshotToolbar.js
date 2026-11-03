import { Camera, Download, LoaderCircle, X } from 'lucide-react'
import { downloadFile } from '../utils/mapPanelHelpers'

// Copies a screenshot of the map window to the clipboard (html2canvas, see useMapScreenshot).
// The Earth Engine thumbnail export stays off, as in the old workspace: it doesn't work yet.
export default function ScreenshotToolbar({ isPanelCapturing, onPanelScreenshot }) {
  return (
    <button
      title={isPanelCapturing ? 'Copying…' : 'Copy a screenshot of the map'}
      onClick={onPanelScreenshot}
      disabled={isPanelCapturing}
    >
      {isPanelCapturing ? <LoaderCircle className='lucide turning' /> : <Camera className='lucide' />}
    </button>
  )
}

/** The screenshot just taken, beside the toolbar: copied or not, to download, until dismissed */
export const ScreenshotCard = ({ shot, onDismiss }) => (
  <div className='float eo-shot' data-html2canvas-ignore=''>
    <img src={shot.dataUrl} alt='Screenshot of the map' />
    <div className='row' style={{ padding: 8, gap: 4 }}>
      <span className='sm' style={{ flex: 1 }}>
        {shot.copied ? 'Copied to clipboard' : 'Couldn’t copy it. Download it instead.'}
      </span>
      <button className='btn ghost s icon' title='Download' onClick={() => downloadFile(shot.dataUrl, 'gee-map.png')}>
        <Download className='lucide' />
      </button>
      <button className='btn ghost s icon' title='Dismiss' onClick={onDismiss}>
        <X className='lucide' />
      </button>
    </div>
  </div>
)
