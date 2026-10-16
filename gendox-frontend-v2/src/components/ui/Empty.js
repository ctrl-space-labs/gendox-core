const Empty = ({ icon, title, text, action }) => {
  return (
    <div className='empty'>
      {icon && <span className='ic'>{icon}</span>}
      <b>{title}</b>
      {text && <p className='muted'>{text}</p>}
      {action}
    </div>
  )
}

export default Empty
