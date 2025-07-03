import React from 'react'
import { Box, IconButton, Chip, TextField, Button } from '@mui/material'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'

const buildAnswerMap = (taskEdgesList) => {
  // Group edges by fromNodeId (answer node)
  const edgesByFromNode = taskEdgesList.reduce((acc, edge) => {
    if (!acc[edge.fromNode.id]) acc[edge.fromNode.id] = []
    acc[edge.fromNode.id].push(edge)
    return acc
  }, {})

  const answerMap = new Map()

  // For each answer node, find its linked document and question nodes
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
      // Save the answer message once from fromNode.nodeValue.message
      if (edge.fromNode.nodeValue?.message) {
        message = edge.fromNode.nodeValue.message
      }
    })

    if (documentNodeId && questionNodeId) {
      // key: "documentId-questionId"
      answerMap.set(`${documentNodeId}-${questionNodeId}`, message)
    }
  })

  return answerMap
}

const DocumentRows = ({ documents, questions, onAnswerChange, openUploader, taskEdgesList }) => {
  console.log('Document Rows:', documents, questions, taskEdgesList)
const answerMap = React.useMemo(() => buildAnswerMap(taskEdgesList?.content || []), [taskEdgesList])
  return (
    <>
      {documents.map((doc, docIdx) => (
        <Box key={doc.id} sx={{ display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider', py: 1, '&:hover': { backgroundColor: 'action.hover' } }}>
          <Box sx={{ flex: 2, display: 'flex', alignItems: 'center' }}>
            {doc.documentId ? (
              <IconButton color='error' onClick={() => { /* implement delete */ }}>
                <DeleteOutlineIcon />
              </IconButton>
            ) : (
              <IconButton color='primary' onClick={() => { openUploader() }}>
                <UploadFileIcon />
              </IconButton>
            )}
            <Chip
              label={doc.name || (doc.documentId ? 'Unknown Document' : 'Upload Document')}
              variant={doc.name ? 'filled' : 'outlined'}
              color={doc.name ? 'primary' : 'default'}
              sx={{ cursor: 'pointer' }}
              onClick={() => (doc.documentId ? null : openUploader())}
            />
          </Box>

          {questions.map((question, qIdx) => {
            const answerKey = `${doc.id}-${question.id}`
            const answerValue = answerMap.get(answerKey) || ''

            return (
              <Box key={qIdx} sx={{ flex: 3, px: 1 }}>
                <TextField
                  fullWidth
                  size='small'
                  value={answerValue}
                  placeholder='Click generate'
                  onChange={e => onAnswerChange(docIdx, qIdx, e.target.value)}
                />
              </Box>
            )
          })}

          <Box sx={{ flex: 1 }}>
            <Button size='small' variant='contained' onClick={() => {/* generate answers */}}>
              Generate
            </Button>
          </Box>
        </Box>
      ))}
    </>
    
  )
}

export default DocumentRows
