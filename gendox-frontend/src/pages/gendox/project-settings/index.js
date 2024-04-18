import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import ProjectSettingsCard from 'src/views/gendox-components/project-settings-components/ProjectSettingsCard';
import { useAuth } from 'src/hooks/useAuth';
import authConfig from 'src/configs/auth';
import { fetchOrganizationById } from "src/store/apps/activeOrganization/activeOrganization";
import { fetchProjectById } from "src/store/apps/activeProject/activeProject";


const ProjectSettings = () => {
  const auth = useAuth()
  const dispatch = useDispatch();
  const router = useRouter();
  const { organizationId, projectId } = router.query; 

  const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName);
    if (!storedToken) {
      console.error('No token found');      
      return;
    }

  useEffect(() => {
    if (organizationId && projectId && storedToken) {
      dispatch(fetchOrganizationById({ organizationId, storedToken}))
      dispatch(fetchProjectById({ organizationId, projectId, storedToken }));
    }
  }, [organizationId, projectId, storedToken]);
  
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProject = async () => {
      if (projectId && organizationId) {
        setLoading(true);
        const activeOrganization = auth.user.organizations.find(org => org.id === organizationId)
        const selectedProject = activeOrganization.projects.find(proj => proj.id === projectId)
        
        if (!selectedProject) {
          setError('Project not found in the selected organization.');
          setLoading(false);
          return;
        } 
        else {
          setLoading(false);
        }
        
      }
    };
    fetchProject();
  }, [auth, organizationId, projectId, router]);


  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ProjectSettingsCard />
  );

}

export default ProjectSettings
