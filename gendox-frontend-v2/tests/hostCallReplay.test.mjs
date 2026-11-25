import test from 'node:test'
import assert from 'node:assert/strict'
import { routeHostCall } from '../src/utils/chatCompletionSession.js'

const call = { id: 'call-id', requiresApproval: true, function: { name: 'crm_save_note' } }
const replay = { replayed: true, sent: new Set([call.id]), decisions: {} }

test('replay resubmits a decline even if a call was previously marked as sent', () => {
  assert.equal(routeHostCall(call, { ...replay, decisions: { [call.id]: false } }), 'decline')
})

test('replay requires an explicit approval before sending a call to the host', () => {
  assert.equal(routeHostCall(call, replay), 'ask')
  assert.equal(routeHostCall(call, { ...replay, decisions: { [call.id]: true } }), 'send')
})

test('ordinary calls are sent again only on replay, while native commands use native approval', () => {
  const ordinary = { ...call, requiresApproval: false }
  assert.equal(routeHostCall(ordinary, { ...replay, replayed: false }), undefined)
  assert.equal(routeHostCall(ordinary, replay), 'send')
  assert.equal(routeHostCall({ ...call, function: { name: 'run_command' } }, { ...replay, nativeHost: true }), 'send')
})
