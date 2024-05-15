import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from 'src/hooks/useAuth';
import authConfig from 'src/configs/auth';
import { fetchOrganization } from "src/store/apps/activeOrganization/activeOrganization";
import OrganizationSettingsCard from 'src/views/gendox-components/organization-settings/OrganizationSettingsCard';


const OrganizationSettings = () => {
  const auth = useAuth()
  const dispatch = useDispatch();
  const router = useRouter();
  const { organizationId } = router.query; 

  const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName);
    if (!storedToken) {
      console.error('No token found');      
      return;
    }

    

  useEffect(() => {
    console.log("organizationId", organizationId)
    if (organizationId && storedToken) {
      dispatch(fetchOrganization({ organizationId, storedToken}))
     console.log("dispatched")
    }
  }, [organizationId, storedToken, dispatch]); 
  

  
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOrganizationDetails = async () => {
      if (organizationId) {
        setLoading(true);
        const activeOrganization = auth.user.organizations.find(org => org.id === organizationId)
        
        
        if (!activeOrganization) {
          setError('Organization not found in the users organizations.');
          setLoading(false);
          return;
        } 
        else {
          setLoading(false);
        }
        
      }
    };
    loadOrganizationDetails();
  }, [auth, organizationId, router]);


  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <OrganizationSettingsCard />
  );

}

export default OrganizationSettings
