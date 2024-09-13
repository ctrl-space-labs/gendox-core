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
    field: "organizationTitle",
    headerName: "Organization",
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
          <Icon icon="mdi:domain" />
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
    minWidth: 200,
    headerName: "Projects",
    field: "Projects",
    renderCell: ({ row }) => (
      <Box sx={{ width: "100%" }}>
        <Typography variant="body2">{row.projects.length}</Typography>
        <LinearProgress
          variant="determinate"
          value={row.projects.length}
          color={row.progressColor}
          sx={{ height: 6, mt: 1, borderRadius: "5px" }}
        />
      </Box>
    ),
  },
  {
    flex: 0.15,
    minWidth: 100,
    field: "address",
    headerName: "address",
    renderCell: ({ row }) => (
      <Typography variant="body2">{row.address}</Typography>
    ),
  },
  {
    flex: 0.15,
    minWidth: 100,
    field: "phone",
    headerName: "phone",
    renderCell: ({ row }) => (
      <Typography variant="body2">{row.phone}</Typography>
    ),
  },
  
];

const UserViewOverviewOrganizations = ({ userData }) => {
  const router = useRouter();
  // ** State
  const [value, setValue] = useState("");
  const [data, setData] = useState(userData.organizations);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 7,
  });


  const handleRowClick = (params) => {
    const organizationId = params.row.id;
    router.push(`/gendox/home?organizationId=${organizationId}&projectId=null`);
};


  useEffect(() => {
    const filteredData = userData.organizations.filter(
      (org) =>
        org.name.toLowerCase().includes(value.toLowerCase()) ||
        (org.address &&
          org.address.toLowerCase().includes(value.toLowerCase())) ||
        org.phone.includes(value)
    );
    setData(filteredData);
  }, [value, userData.organizations]);

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardHeader title="User's Organizations List" />
          <CardContent>
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
                placeholder="Search Organization"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </Box>
          </CardContent>
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

export default UserViewOverviewOrganizations;
