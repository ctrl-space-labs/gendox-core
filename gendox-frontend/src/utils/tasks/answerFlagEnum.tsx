import React from 'react'
import { Info, CheckCircle, AlertTriangle, AlertCircle, HelpCircle, PlayCircle } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AnswerFlag =
  | 'INFO'
  | 'OK'
  | 'WARNING'
  | 'MINOR_ISSUE'
  | 'MAJOR_ISSUE'
  | 'CRITICAL_ISSUE'
  | 'NA'
  | ''

export type ChipColor = 'info' | 'success' | 'warning' | 'error' | 'secondary'

export interface AnswerFlagProps {
  label: string
  chipColor: ChipColor
}

// ---------------------------------------------------------------------------
// answerFlagEnum
// Returns a lucide-react icon element sized at 16 px (equivalent to MUI "small").
// The `theme` parameter is kept for backwards-compatibility but is no longer used.
// ---------------------------------------------------------------------------

export const answerFlagEnum = (flag: AnswerFlag | string, _theme?: unknown): React.ReactElement => {
  switch (flag) {
    case 'INFO':
      return <Info size={16} className='text-primary' aria-label='Info' />
    case 'OK':
      return <CheckCircle size={16} className='text-primary' aria-label='OK' />
    case 'WARNING':
      return <AlertTriangle size={16} className='text-amber-500' aria-label='Warning' />
    case 'MINOR_ISSUE':
      return <AlertCircle size={16} className='text-amber-700' aria-label='Minor Issue' />
    case 'MAJOR_ISSUE':
      return <AlertCircle size={16} className='text-destructive' aria-label='Major Issue' />
    case 'CRITICAL_ISSUE':
      return <AlertCircle size={16} className='text-destructive' aria-label='Critical Issue' />
    case 'NA':
      return <HelpCircle size={16} className='text-muted-foreground' aria-label='N/A' />
    case '':
      return <Info size={16} className='text-primary' aria-label='See details' />
    default:
      return <PlayCircle size={16} className='text-muted-foreground' aria-label='Click Generate' />
  }
}

// ---------------------------------------------------------------------------
// getAnswerFlagProps
// Returns a label and a chip color string for the given flag value.
// ---------------------------------------------------------------------------

export const getAnswerFlagProps = (flag: AnswerFlag | string): AnswerFlagProps => {
  switch (flag) {
    case 'INFO':
      return { label: 'Info', chipColor: 'info' }
    case 'OK':
      return { label: 'OK', chipColor: 'success' }
    case 'WARNING':
      return { label: 'Warning', chipColor: 'warning' }
    case 'MINOR_ISSUE':
      return { label: 'Minor', chipColor: 'warning' }
    case 'MAJOR_ISSUE':
      return { label: 'Major', chipColor: 'error' }
    case 'CRITICAL_ISSUE':
      return { label: 'Critical', chipColor: 'error' }
    case 'NA':
      return { label: 'N/A', chipColor: 'secondary' }
    case '':
      return { label: 'See details', chipColor: 'info' }
    default:
      return { label: 'Not generated', chipColor: 'secondary' }
  }
}
