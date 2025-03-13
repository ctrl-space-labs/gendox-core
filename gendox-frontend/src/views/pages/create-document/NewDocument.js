import React, { useState, useRef, useEffect } from 'react'
import { styled } from '@mui/material/styles'
import * as Showdown from 'showdown'
import ReactMde from 'react-mde'
import Box from '@mui/material/Box'
import { InputLabel } from '@mui/material'
import Input from '@mui/material/Input'
import 'react-mde/lib/styles/css/react-mde-all.css'


const StyledReactMde = styled(ReactMde)(({ theme }) => ({
  backgroundColor: 'transparent',
  // Target header
  '& .mde-header': {
    backgroundColor: 'transparent'
  },
  // Target text area and preview pane
  '& .mde-textarea, & .mde-preview': {
    backgroundColor: 'transparent'
  },
  // Target toolbar and buttons
  '& .mde-toolbar': {
    backgroundColor: 'transparent',
    '& button': {
      backgroundColor: 'transparent',
      border: 'none',
      boxShadow: 'none'
    }
  }
}))

const NewDocument = ({ documentTitle, setDocumentTitle, markdownValue, setMarkdownValue, titleError }) => {
  const [selectedTab, setSelectedTab] = useState('write')
  console.log('markdownValue:', markdownValue)
  // Set up the markdown converter
    const converter = new Showdown.Converter({
      tables: true,
      simplifiedAutoLink: true,
      strikethrough: true,
      tasklists: true,
      openLinksInNewWindow: true,
      backslashEscapesHTMLTags: true,
      emoji: true,
      underline: true,
      completeHTMLDocument: false,
      noHeaderId: true,
      headerLevelStart: 2,
      parseImgDimensions: true,
      literalMidWordUnderscores: true,
      simpleLineBreaks: true,
      excludeTrailingPunctuationFromURLs: true,
      ghCodeBlocks: true,
      requireSpaceBeforeHeadingText: true
    })
  
  return (
    <Box>
      <Box
        sx={{
          py: 1,
          px: 4,
          display: 'flex',
          alignItems: 'center',
          borderBottom: theme => `1px solid ${theme.palette.divider}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <InputLabel
            sx={{
              mr: 3,
              color: titleError ? 'error.main' : 'primary.main',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              minWidth: '80px'
            }}
          >
            Name: {'  '}
            {titleError && (
              <span style={{ color: 'error.main', fontSize: '0.8rem' }}>
                <sup
                  style={{
                    fontSize: '0.7rem',
                    position: 'relative',
                    top: '-0.3em'
                  }}
                >
                  * required
                </sup>
              </span>
            )}
          </InputLabel>
          <Input
            fullWidth
            value={documentTitle}
            id='title-input'
            onChange={e => setDocumentTitle(e.target.value)}
            sx={{
              flexGrow: 1,
              '&:before, &:after': { display: 'none' },
              '& .MuiInput-input': { py: 1.875 }
            }}
          />
        </Box>
      </Box>

      {/* Markdown Editor */}
      <StyledReactMde
        value={markdownValue}
        onChange={setMarkdownValue}
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
        generateMarkdownPreview={markdown => Promise.resolve(converter.makeHtml(markdown))}
        childProps={{
          writeButton: {
            // textArea: {
            //     style: { backgroundColor: 'transparent' }
            //   },
            tabIndex: -1
          }
        }}
      />
    </Box>
  )
}

export default NewDocument
