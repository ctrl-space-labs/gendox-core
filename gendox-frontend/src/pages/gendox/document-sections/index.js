// ** MUI Imports
import Grid from '@mui/material/Grid'

import DocumentSectionsCard from 'src/views/gendox-components/document-sections-components/DocumentSectionsCard'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Axios
import axios from 'axios'

// ** Redux
import { useSelector, useDispatch } from 'react-redux'

// ** Config
import authConfig from 'src/configs/auth'
import apiRequests from 'src/configs/apiRequest'

// ** Demo Components Imports
import { useAuth } from 'src/hooks/useAuth'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'



const DocumentSections = () => {

  return (
    <DocumentSectionsCard/>
  );

}

export default DocumentSections
