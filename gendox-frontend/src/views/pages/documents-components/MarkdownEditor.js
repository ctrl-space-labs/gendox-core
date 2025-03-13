import React, { useState } from 'react'
import { styled } from '@mui/material/styles'
import ReactMde from 'react-mde'
import * as Showdown from 'showdown'
import 'react-mde/lib/styles/css/react-mde-all.css'
import Box from '@mui/material/Box'
import Input from '@mui/material/Input'
import InputLabel from '@mui/material/InputLabel'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import Icon from 'src/views/custom-components/mui/icon/icon'

const StyledReactMde = styled(ReactMde)(({ theme }) => ({
    backgroundColor: 'transparent',
    // Target header
    '& .mde-header': {
      backgroundColor: 'transparent',
    },
    // Target text area and preview pane
    '& .mde-textarea, & .mde-preview': {
      backgroundColor: 'transparent',
    },
    // Target toolbar and buttons
    '& .mde-toolbar': {
      backgroundColor: 'transparent',
      '& button': {
        backgroundColor: 'transparent',
        border: 'none',
        boxShadow: 'none',
      },
    },
  }))

const MarkdownEditorComponent = ({
  sectionTitle,
  setSectionTitle,
  markdownValue,
  setMarkdownValue,
  isSectionMinimized,
  handleMinimize,
  handleDeleteConfirmOpen
}) => {
  const [selectedTab, setSelectedTab] = useState('write')

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
      {/* Header with title and action buttons */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 1,
          borderBottom: theme => `1px solid ${theme.palette.divider}`
        }}
      >
        <InputLabel sx={{ mr: 3, color: 'primary.main' }}>Title:</InputLabel>
        <Input
          fullWidth
          value={sectionTitle}
          onChange={e => setSectionTitle(e.target.value)}
          placeholder='Section Title'
          sx={{
            '& .MuiInput-input': { py: 1.875 }
          }}
        />
        <Tooltip title={isSectionMinimized ? 'Maximize' : 'Minimize'}>
          <IconButton sx={{ p: 1, color: 'primary.main' }} onClick={handleMinimize}>
            <Icon icon={isSectionMinimized ? 'mdi:arrow-expand' : 'mdi:arrow-collapse'} />
          </IconButton>
        </Tooltip>
        <Tooltip title='Delete'>
          <IconButton sx={{ p: 1, color: 'primary.main' }} onClick={handleDeleteConfirmOpen}>
            <Icon icon='mdi:delete' />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Markdown Editor */}
      {!isSectionMinimized && (
        <StyledReactMde
          value={markdownValue}
          onChange={setMarkdownValue}
          selectedTab={selectedTab}
          onTabChange={setSelectedTab}
          generateMarkdownPreview={markdown => Promise.resolve(converter.makeHtml(markdown))}
          childProps={{
            // textArea: {
            //     style: { backgroundColor: 'transparent' }
            //   },
            writeButton: {
              tabIndex: -1
            }
          }}
        />
      )}
    </Box>
  )
}

export default MarkdownEditorComponent
