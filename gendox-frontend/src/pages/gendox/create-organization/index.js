import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSelector, useDispatch } from 'react-redux'
import { useAuth } from 'src/authentication/useAuth'
import { localStorageConstants } from 'src/utils/generalConstants'
import organizationService from 'src/gendox-sdk/organizationService'

import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import toast from 'react-hot-toast'
import CircularProgress from '@mui/material/CircularProgress'
import { getErrorMessage } from 'src/utils/errorHandler'
import { styled } from '@mui/material/styles'

const Form = styled('form')(({ theme }) => ({
  // maxWidth: 400,
  // padding: theme.spacing(12),
  // borderRadius: theme.shape.borderRadius,
  // border: `1px solid ${theme.palette.divider}`
}))

const CreateOrganization = () => {
  const auth = useAuth()
  const dispatch = useDispatch()
  const router = useRouter()

  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)

  const [name, setName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  const handleNameChange = event => setName(event.target.value)
  const handleDisplayNameChange = event => setDisplayName(event.target.value)
  const handleAddressChange = event => setAddress(event.target.value)
  const handlePhoneChange = event => setPhone(event.target.value)

  const handleSubmit = async e => {
    e.preventDefault()

    setLoading(true)
    const newOrganizationPayload = {
      name,
      displayName,
      address,
      phone
    }

    try {
      const response = await organizationService.createOrganization(newOrganizationPayload, token)
      toast.success('Organization created successfully!')
      await auth.loadUserProfileFromAuthState(auth.oidcAuthState)
      router.push(`/gendox/create-project/?organizationId=${response.data.id}`)
    } catch (error) {
      console.log('Failed to create organization', response)
      console.error('Failed to update organization', error)
      toast.error(`Organization did not create. Error: ${getErrorMessage(error)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader title='Create New Organization' />
      <Divider sx={{ m: '0' }} />
      <Form onSubmit={handleSubmit}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField id='organization-name' label='Name' value={name} onChange={handleNameChange} fullWidth />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                rows={4}
                label='displayName'
                id='organization-displayName'
                value={displayName}
                onChange={handleDisplayNameChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                rows={4}
                label='address'
                id='organization-address'
                value={address}
                onChange={handleAddressChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                rows={4}
                label='phone'
                id='organization-phone'
                value={phone}
                onChange={handlePhoneChange}
                fullWidth
              />
            </Grid>
          </Grid>
        </CardContent>
        <CardActions>
          {loading ? (
            <CircularProgress size={24} />
          ) : (
            <>
              <Button size='large' type='submit' sx={{ mr: 2 }} variant='contained'>
                Submit
              </Button>
              <Button size='large' type='reset' color='secondary' variant='outlined'>
                Reset
              </Button>
            </>
          )}
        </CardActions>
      </Form>
    </Card>
  )
}

export default CreateOrganization
