const BASE_KEY = 'lab.baseUrl'
const TOKEN_KEY = 'lab.token'
const DEFAULT_BASE = 'http://localhost:8080/gendox/api/v1'

export const getBaseUrl = () => localStorage.getItem(BASE_KEY) || DEFAULT_BASE
export const setBaseUrl = v => localStorage.setItem(BASE_KEY, v)
export const getToken = () => localStorage.getItem(TOKEN_KEY) || ''
export const setToken = v => localStorage.setItem(TOKEN_KEY, v)

// the exp claim of the pasted token, so the lab can say when it goes stale
export function tokenExpiry() {
  try {
    const payload = JSON.parse(atob(getToken().split('.')[1]))

    return payload.exp ? new Date(payload.exp * 1000) : null
  } catch {
    return null
  }
}

export async function call(path, { method = 'GET', body } = {}) {
  const res = await fetch(getBaseUrl() + path, {
    method,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  })

  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null // Tomcat answers HTML for some errors
  }

  if (!res.ok) {
    const error = new Error(data?.errorMessage || `${res.status} ${res.statusText}`)
    error.code = data?.errorCode
    error.status = res.status
    throw error
  }

  return data
}