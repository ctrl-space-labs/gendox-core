// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import MuiAccordion from '@mui/material/Accordion'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

const Accordion = styled(MuiAccordion)(({ theme }) => ({
  '&:before': { display: 'none' },
  boxShadow: `${theme.shadows[0]} !important`,
  borderLeft: `1px solid ${theme.palette.divider}`,
  borderRight: `1px solid ${theme.palette.divider}`,
  borderBottom: `1px solid ${theme.palette.divider}`,
  '&:first-of-type': { borderTop: `1px solid ${theme.palette.divider}` },
  '&.Mui-expanded + .MuiAccordion-root': { borderTop: `1px solid ${theme.palette.divider}` }
}))

const data = {
  faq: [
    {
      id: 'panel1',
      question: 'What are the rate limits for my subscription plan?',
      answer: 'Your subscription plan includes an API rate limit of X completions per minute for regular users and X completions per minute for public users.',
    },
    {
      id: 'panel2',
      question: 'Can I increase the number of seats in my subscription?',
      answer:
        'Yes, you can increase the number of seats by upgrading your plan or contacting support to add more seats to your current plan.',
    },
    {
      id: 'panel3',
      question: 'What happens when I reach my file upload limit?',
      answer:
        'When you reach your file upload limit, you will either need to upgrade your plan for more storage or manage your uploaded files to free up space.',
    },
    {
      id: 'panel4',
      question: 'How do I upgrade or downgrade my subscription plan?',
      answer:
        'You can upgrade or downgrade your subscription plan by navigating to your account settings and selecting the desired plan. Changes take effect immediately.',
    },
    {
      id: 'panel5',
      question: 'What is the difference between monthly and annual plans?',
      answer:
        'Monthly plans are billed every month, whereas annual plans provide a discounted rate and are billed once a year. You can switch between the two in your subscription settings.',
    },
    {
      id: 'panel6',
      question: 'What is the policy for unused messages or uploads?',
      answer:
        'Unused messages or uploads do not roll over to the next billing period. It is recommended to upgrade your plan if you expect higher usage in the future.',
    },
  ],
}



const PricingFooter = () => {
  
  const [expanded, setExpanded] = useState(false)

  const handleChange = panel => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false)
  }

  const renderAccordion = () => {
    return data?.faq.map(item => {
      return (
        <Accordion key={item.id} elevation={0} expanded={expanded === item.id} onChange={handleChange(item.id)}>
          <AccordionSummary
            id={`pricing-accordion-${item.id}-header`}
            expandIcon={<Icon icon='mdi:chevron-down' />}
            aria-controls={`pricing-accordion-${item.id}-content`}
          >
            <Typography>{item.question}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>{item.answer}</Typography>
          </AccordionDetails>
        </Accordion>
      )
    })
  }

  return (
    <>
      <Box sx={{ mb: 11.75, textAlign: 'center' }}>
        <Typography variant='h5' sx={{ mb: 2.5 }}>
          FAQs
        </Typography>
        <Typography variant='body2'>Let us help answer the most common questions.</Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <div>{renderAccordion()}</div>
      </Box>
    </>
  )
}

export default PricingFooter
