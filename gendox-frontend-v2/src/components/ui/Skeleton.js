// what a list looks like while it loads: its rows, as shimmering bars (see .skel in app.css)

// varied lengths, so the rows read as text rather than as a grid
const LENGTHS = ['62%', '48%', '74%', '55%', '68%']

/**
 * Table rows for a `.table` whose data is loading.
 * @param columns - one entry per column: a CSS width for its bar, or null for an empty cell (e.g. an actions column).
 *   The first column is the row's name and always gets a bar, its length varying from row to row.
 */
export const SkeletonRows = ({ rows = 3, columns = [null] }) =>
  Array.from({ length: rows }, (_, row) => (
    <tr key={row} className='skel-row' aria-hidden='true'>
      {columns.map((width, col) => (
        <td key={col}>{(col === 0 || width) && <span className='skel' style={{ width: col === 0 ? LENGTHS[row % LENGTHS.length] : width }} />}</td>
      ))}
    </tr>
  ))

/** Rows of a list that is not a table: a title line and a shorter line under it */
export const SkeletonList = ({ rows = 3 }) => (
  <div className='skel-list' aria-busy='true' aria-label='Loading'>
    {Array.from({ length: rows }, (_, row) => (
      <div key={row} className='skel-item'>
        <span className='skel' style={{ width: LENGTHS[row % LENGTHS.length] }} />
        <span className='skel' style={{ width: '32%', height: '.75em' }} />
      </div>
    ))}
  </div>
)
