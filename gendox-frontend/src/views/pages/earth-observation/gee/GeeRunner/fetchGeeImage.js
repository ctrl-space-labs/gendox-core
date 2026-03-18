// Fetches a GEE image URL (thumbnail or screenshot) using the stored access token
// and converts the response to a base64 data URL for use in <img> tags or Redux state.
export function fetchGeeImage(url) {
  const geeToken = window.localStorage.getItem('gee_access_token')
  if (!geeToken) return Promise.resolve(null)

  return fetch(url, { headers: { Authorization: 'Bearer ' + geeToken } })
    .then(res => {
      if (!res.ok) throw new Error('HTTP ' + res.status)
      return res.blob()
    })
    .then(
      blob =>
        new Promise(resolve => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(blob)
        })
    )
}
