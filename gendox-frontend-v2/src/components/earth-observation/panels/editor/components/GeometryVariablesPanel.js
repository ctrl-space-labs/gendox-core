import { useSelector } from 'react-redux'
import { ChevronRight, Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import { selectEoGeometries } from 'src/store/earthObservation'
import { GEOM_ICON, GEOM_TYPE_MAP } from 'src/components/earth-observation/panels/map/constants/geometryConstants'
import { geometrySlug } from 'src/components/earth-observation/panels/map/utils/geometryHelpers'

/** The shapes drawn on the map, as the script reaches them: geometries['Title'], geometries[i] or geometries.slug */
export default function GeometryVariablesPanel() {
  const eoGeometries = useSelector(selectEoGeometries)

  if (!eoGeometries?.length) return null

  return (
    <details className='eo-geo'>
      <summary>
        <ChevronRight className='lucide' style={{ width: 14 }} />
        Shapes in code<span className='faint num'>{eoGeometries.length}</span>
      </summary>
      <div className='rows'>
        {eoGeometries.map((geom, i) => {
          const type = GEOM_TYPE_MAP[geom.geometryTypeName] ?? geom.geometryTypeName
          const Icon = GEOM_ICON[type] ?? GEOM_ICON.Point
          const label = geom.title || geom.name || `${type} ${i + 1}`
          const snippet = `geometries["${label}"]`
          const slug = geometrySlug(label)

          return (
            <div key={geom.id ?? i} className='row sm' style={{ gap: 8 }}>
              <Icon className='lucide' style={{ width: 14, color: 'var(--text-3)' }} />
              <code className='trunc' style={{ flex: 1 }}>
                {snippet}
              </code>
              <span className='faint hide-sm' title={slug ? `or geometries.${slug}` : undefined}>
                or geometries[{i}]
              </span>
              <button
                className='btn ghost s icon'
                title='Copy'
                onClick={() => navigator.clipboard?.writeText(snippet).then(() => toast.success('Copied'))}
              >
                <Copy className='lucide' />
              </button>
            </div>
          )
        })}
      </div>
    </details>
  )
}
