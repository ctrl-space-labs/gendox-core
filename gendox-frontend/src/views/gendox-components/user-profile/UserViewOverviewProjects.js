// ** React Imports
import { useState, useEffect } from "react";

// ** MUI Imports
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import { styled } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";
import CardContent from "@mui/material/CardContent";
import { DataGrid } from "@mui/x-data-grid";
import LinearProgress from "@mui/material/LinearProgress";
import Grid from "@mui/material/Grid";

import { useRouter } from 'next/router'

// ** Icon Imports
import Icon from "src/@core/components/icon";

const columns = [
  {
    flex: 0.3,
    minWidth: 230,
    field: "projectTitle",
    headerName: "Project",
    renderCell: ({ row }) => (
      <Box sx={{ display: "flex", alignItems: "center", }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            mr: 2,
            // color: "primary.main",
          }}
        >
          <Icon icon="mdi:view-grid-outline" />
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: "0.875rem",
              color: "primary.main",
            }}
          >
            {row.name}
          </Typography>
          
        </Box>
      </Box>
    ),
  },
  {
    flex: 0.15,
    minWidth: 100,
    field: "description",
    headerName: "description",
    renderCell: ({ row }) => (
      <Typography variant="body2">{row.description}</Typography>
    ),
  },
  
  
];

const UserViewOverviewProjects = ({ userData }) => {
  const router = useRouter();
  // ** State
  const [value, setValue] = useState("");
  const [data, setData] = useState([]);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 7,
  });

  useEffect(() => {
    // Flattening the data to get a list of all projects along with organization info
    const projects = userData.organizations.flatMap(org =>
      org.projects.map(project => ({
        ...project,   
        organizationId: org.id,     
      }))
    );    
  
    // Filter projects based on search input
    const filteredProjects = projects.filter(
      project =>
        project.name.toLowerCase().includes(value.toLowerCase()) ||
        project.description.toLowerCase().includes(value.toLowerCase())
    );
    
    setData(filteredProjects);
  }, [value, userData.organizations]);
  


  const handleRowClick = (params) => {
    
    const organizationId = params.row.organizationId;
    const projectId = params.row.id;
    router.push(`/gendox/home/?organizationId=${organizationId}&projectId=${projectId}`);
};



  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardHeader title="User's Projects List" />
          {/* <CardContent>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              <Typography variant="body2" sx={{ mr: 2 }}>
                Search:
              </Typography>
              <TextField
                size="small"
                placeholder="Search Project"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </Box>
          </CardContent> */}
          <DataGrid
            autoHeight
            rows={data}
            columns={columns}
            disableRowSelectionOnClick
            pageSizeOptions={[7, 10, 25, 50]}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            onRowClick={handleRowClick}
            sx={{
              '& .MuiDataGrid-row': {
                cursor: 'pointer', 
              }
            }}
          />
        </Card>
      </Grid>
    </Grid>
  );
};

export default UserViewOverviewProjects;
