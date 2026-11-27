import artifactService from 'src/gendox-sdk/artifactService'
import { getToken } from 'src/components/agent/useAgent'

/**
 * What an artifact may ask the host for through gendox.use (gendox-core#600): its data and who is viewing. The frame
 * is sealed, so the artifact never holds a token or reaches the network; each call arrives here as a message from its
 * own frame, is checked, and is made with the signed-in user's token. Only what the artifact declared is given, only
 * to a signed-in user, and only on an artifact that is stored (a widget or a public page gets nothing).
 *
 * The API decides who may read and write; the host also limits how often, so a runaway artifact cannot flood it, and
 * polls the collections the artifact watches while it is open.
 */

const POLL_MS = 5000
const LIMITS = { read: { count: 120, perMs: 10_000 }, write: { count: 30, perMs: 10_000 } }
const WRITES = ['gendox/data/set', 'gendox/data/update', 'gendox/data/delete']
const MAX_WATCHED = 10
// the API's own rules for keys, checked before a URL is made of them: a key can never be a path segment such as ".."
const COLLECTION = /^[A-Za-z0-9_-]{1,64}$/
const DOC_ID = /^[A-Za-z0-9_:-][A-Za-z0-9_.:-]{0,127}$/

const nameOf = user =>
  user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.userName || user?.email || ''

// a document as the artifact reads it
const documentOf = dto => ({
  id: dto.docId,
  data: dto.data,
  private: Boolean(dto.private),
  revision: dto.revision,
  updatedBy: dto.updatedBy || null,
  updatedAt: dto.updatedAt || null
})

// an error the artifact can act on: the API's code and message, never the request
const failureOf = error => ({
  code: error?.response
    ? error.response.data?.errorCode || (error.response.status === 404 ? 'NOT_FOUND' : 'FAILED')
    : error?.code || 'FAILED',
  message: String(error?.response?.data?.errorMessage || error?.message || 'The request failed').slice(0, 300)
})

const refused = (code, message) => Object.assign(new Error(message), { code })

// who a token belongs to (its subject), read from the token itself; null when there is none or it cannot be read
const subjectOf = token => {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')

    return JSON.parse(atob(payload)).sub || null
  } catch (_) {
    return null
  }
}

/**
 * @param context() - the frame's current { artifactId, capabilities, user }
 * @param notify(method, params) - sends a notification to the frame
 */
export const createArtifactHost = (context, notify) => {
  const used = { read: [], write: [] }
  const watched = new Map() // collection -> the last list sent, as JSON
  let timer = null
  let generation = 0 // raised by reset: a read that started before it tells nothing to what came after
  // the session the frame was rendered for: the token is shared by every tab and may change under it, when another
  // user signs in; a call is made only while the token still belongs to the same person (a renewed one does)
  let session = subjectOf(getToken())

  // the token to call with, or a refusal when it is now someone else's
  const tokenOfSession = () => {
    const token = getToken()
    if (!token || !session || subjectOf(token) !== session) {
      throw refused('SESSION_CHANGED', 'The signed-in user changed; open the artifact again')
    }

    return token
  }
  const names = new Map() // user id -> name, of the artifact's own agent, as the server gave them; per instance

  const allowed = name => {
    const { artifactId, capabilities, user } = context()

    return Boolean(artifactId && user?.id && Array.isArray(capabilities) && capabilities.includes(name))
  }

  const spend = kind => {
    const now = Date.now()
    const { count, perMs } = LIMITS[kind]
    used[kind] = used[kind].filter(at => now - at < perMs)
    if (used[kind].length >= count) throw refused('RATE_LIMITED', 'Too many requests; slow down')
    used[kind].push(now)
  }

  const list = async collection => {
    const { data } = await artifactService.listArtifactData(context().artifactId, collection, tokenOfSession())

    return (data ?? []).map(documentOf)
  }

  const poll = async () => {
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
    // another user signed in: watch nothing more with their token
    if (subjectOf(getToken()) !== session) return stop()
    const started = generation
    for (const collection of [...watched.keys()]) {
      try {
        const documents = await list(collection)
        if (generation !== started) return
        const json = JSON.stringify(documents)
        if (watched.has(collection) && watched.get(collection) !== json) {
          watched.set(collection, json)
          notify('gendox/data/changed', { collection, documents })
        }
      } catch (_) {
        // the next poll tries again
      }
    }
  }

  const refresh = collection => {
    if (watched.has(collection)) poll()
  }

  const startPolling = () => {
    if (!timer) timer = setInterval(poll, POLL_MS)
  }

  // names from the server, for the artifact's own agent as the server knows it, never the page's: of the ids asked,
  // only its members come back, with a name and never an email
  const profiles = async ids => {
    const wanted = [...new Set((ids || []).filter(id => typeof id === 'string' && /^[0-9a-f-]{36}$/i.test(id)))].slice(0, 200)
    const missing = wanted.filter(id => !names.has(id))
    if (missing.length) {
      const { data } = await artifactService.getArtifactPeople(context().artifactId, missing, tokenOfSession())
      missing.forEach(id => names.set(id, ''))
      ;(data ?? []).forEach(person => names.set(person.userId, person.name || ''))
    }
    const result = {}
    ;(ids || []).forEach(id => {
      if (typeof id === 'string') result[id] = { name: names.get(id) || '' }
    })

    return result
  }

  /** Answers one call of the artifact; rejects with { code, message }. */
  const handle = async (method, params = {}) => {
    try {
      if (method === 'gendox/use') return allowed(String(params.name || ''))

      if (method.startsWith('gendox/user/')) {
        if (!allowed('user')) throw refused('NOT_ALLOWED', 'The artifact did not declare user')
        spend('read')
        const { user } = context()
        if (method === 'gendox/user/id') return user.id
        if (method === 'gendox/user/me') return { id: user.id, name: nameOf(user) }
        if (method === 'gendox/user/profiles') return profiles(params.ids)
      }

      if (method.startsWith('gendox/data/')) {
        if (!allowed('data')) throw refused('NOT_ALLOWED', 'The artifact did not declare data')
        const { artifactId } = context()
        const collection = String(params.collection || '')
        const docId = String(params.docId || '')
        const isPrivate = Boolean(params.private)
        const needsDoc = ['gendox/data/get', 'gendox/data/set', 'gendox/data/update', 'gendox/data/delete'].includes(method)
        if (!COLLECTION.test(collection) || (needsDoc && !DOC_ID.test(docId))) {
          throw refused('ARTIFACT_DATA_KEY_NOT_VALID', 'A key is letters, digits and _ - . : and never starts with a dot')
        }
        spend(WRITES.includes(method) ? 'write' : 'read')

        switch (method) {
          case 'gendox/data/list':
            return list(collection)
          case 'gendox/data/get':
            try {
              const { data } = await artifactService.getArtifactData(artifactId, collection, docId, isPrivate, tokenOfSession())

              return documentOf(data)
            } catch (error) {
              if (error?.response?.status === 404) return null
              throw error
            }
          case 'gendox/data/set':
          case 'gendox/data/update': {
            const request = { data: params.data, private: isPrivate, revision: params.revision ?? null }
            const { data } = await artifactService.writeArtifactData(
              artifactId,
              collection,
              docId,
              request,
              method === 'gendox/data/update',
              tokenOfSession()
            )
            refresh(collection)

            return documentOf(data)
          }
          case 'gendox/data/delete':
            await artifactService.deleteArtifactData(artifactId, collection, docId, isPrivate, tokenOfSession())
            refresh(collection)

            return null
          case 'gendox/data/subscribe':
            if (!watched.has(collection)) {
              if (watched.size >= MAX_WATCHED) throw refused('TOO_MANY_WATCHED', `Watch at most ${MAX_WATCHED} collections`)
              const started = generation
              const documents = await list(collection)
              if (generation !== started) return false
              watched.set(collection, JSON.stringify(documents))
              notify('gendox/data/changed', { collection, documents })
              startPolling()
            }

            return true
          case 'gendox/data/unsubscribe':
            watched.delete(collection)

            return true
          default:
            break
        }
      }
      throw refused('NOT_ALLOWED', 'This call is not allowed')
    } catch (error) {
      throw failureOf(error)
    }
  }

  /** Another artifact, or another version, in the same frame: nothing carries over. */
  const reset = () => {
    generation += 1
    names.clear()
    session = subjectOf(getToken())
    watched.clear()
    used.read = []
    used.write = []
  }

  const stop = () => {
    clearInterval(timer)
    timer = null
    watched.clear()
  }

  return { handle, reset, stop }
}
