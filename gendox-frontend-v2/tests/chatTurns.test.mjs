import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildTurns } from '../src/components/chat/chatUtils.js'

const call = (id, message = '') => ({ messageId: id, role: 'assistant', message, toolCalls: [{ id }] })
const result = id => ({ role: 'tool', toolCallId: id, message: 'result' })

test('groups consecutive tool batches and keeps replies with their original calls', () => {
  const first = call('first')
  const second = call('second')
  const progress = call('third', 'Checking one more thing.')
  const answer = { role: 'assistant', message: 'Done.' }
  const firstResult = result('first')
  const secondResult = result('second')
  const [turn] = buildTurns([first, firstResult, second, secondResult, progress, answer], 'user')

  assert.deepEqual(turn.items, [
    {
      type: 'tools',
      batches: [
        { header: first, calls: [{ call: first.toolCalls[0], responses: [firstResult] }] },
        { header: second, calls: [{ call: second.toolCalls[0], responses: [secondResult] }] }
      ]
    },
    { type: 'answer', message: progress, beforeTools: true },
    { type: 'tools', batches: [{ header: progress, calls: [{ call: progress.toolCalls[0], responses: [] }] }] },
    { type: 'answer', message: answer }
  ])
})

test('attaches a late tool result to its original batch after an assistant message', () => {
  const first = call('first')
  const second = call('second', 'Checking one more thing.')
  const answer = { role: 'assistant', message: 'Done.' }
  const lateResult = result('first')
  const [turn] = buildTurns([first, second, answer, lateResult], 'user')

  assert.deepEqual(turn.items[0].batches[0].calls[0].responses, [lateResult])
  assert.deepEqual(turn.items[2].batches[0].calls[0].responses, [])
  assert.deepEqual(turn.items.at(-1), { type: 'answer', message: answer })
})
