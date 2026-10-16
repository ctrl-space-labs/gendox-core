import { FileCode, FilePenLine, FileSpreadsheet, FileText, Globe, Image as ImageIcon } from 'lucide-react'

// extension → [icon, hue]
const types = {
  pdf: [FileText, 0],
  doc: [FileText, 215],
  docx: [FileText, 215],
  xls: [FileSpreadsheet, 145],
  xlsx: [FileSpreadsheet, 145],
  csv: [FileSpreadsheet, 145],
  txt: [FilePenLine, 270],
  rst: [FilePenLine, 270],
  md: [FileCode, 270],
  image: [ImageIcon, 320],
  web: [Globe, 190]
}

const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg']

/**
 * The tinted file-type square.
 * @param name - a file name, title or URL; its extension picks the icon
 * @param type - overrides the extension, e.g. 'web' or 'image'
 */
const FileTile = ({ name = '', type, className = '' }) => {
  const extension = name.split('?')[0].split('.').pop().toLowerCase()
  const key = type ?? (imageExtensions.includes(extension) ? 'image' : extension)
  const [Icon, hue] = types[key] ?? types.pdf

  return (
    <span className={`ftype ${className}`} style={{ '--h': hue }}>
      <Icon className='lucide' />
    </span>
  )
}

export default FileTile
