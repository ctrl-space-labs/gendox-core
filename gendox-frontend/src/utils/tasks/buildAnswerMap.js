// src/utils/task/buildAnswerMap.js

/**
 * Build a Map keyed by "documentId-questionId" with the corresponding answer message
 * @param {Array} taskEdgesList - list of edges with answer, document, and question nodes
 * @returns {Map<string, string>} - map of "documentId-questionId" to message
 */
export const buildAnswerMap = (taskEdgesList) => {
  const edgesByFromNode = taskEdgesList.reduce((acc, edge) => {
    if (!acc[edge.fromNode.id]) acc[edge.fromNode.id] = []
    acc[edge.fromNode.id].push(edge)
    return acc
  }, {})

  const answerMap = new Map()

  Object.entries(edgesByFromNode).forEach(([answerNodeId, edges]) => {
    let documentNodeId = null
    let questionNodeId = null
    let message = ''

    edges.forEach(edge => {
      const toNodeType = edge.toNode.nodeType.name
      if (toNodeType === 'DOCUMENT') {
        documentNodeId = edge.toNode.id
      } else if (toNodeType === 'QUESTION') {
        questionNodeId = edge.toNode.id
      }
      if (edge.fromNode.nodeValue?.message) {
        message = edge.fromNode.nodeValue.message
      }
    })

    if (documentNodeId && questionNodeId) {
      answerMap.set(`${documentNodeId}-${questionNodeId}`, message)
    }
  })

  return answerMap
}
