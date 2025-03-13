import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";
import { DataGrid } from "@mui/x-data-grid";
import Grid from "@mui/material/Grid";
import { useRouter } from 'next/router'
import Icon from 'src/views/custom-components/mui/icon/icon';

const columns = [
  {
    flex: 0.4,
    field: "name",
    headerName: "PROJECT",
    renderCell: ({ row }) => (
      <Box sx={{ display: "flex", alignItems: "center", }}>
        <Box
          sx={{
            display: "flex",
            mx: 2,
          }}
        >
          <Icon icon="mdi:briefcase-variant-outline" />
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Typography
            sx={{
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
    flex: 0.6,
    minWidth: 200,
    field: "description",
    headerName: "DESCRIPTION",
    renderCell: ({ row }) => (
      <Typography variant="body2">{row.description}</Typography>
    ),
  },


];

const UserViewOverviewProjects = ({ userData }) => {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [data, setData] = useState([]);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  useEffect(() => {
    // Flattening the data to get a list of all projects along with organization info
    const projects = userData.organizations.flatMap(org =>
      org.projects.map(project => ({
        ...project,
        organizationId: org.id,
      }))
    );

    setData(projects);
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
          <CardHeader title="Your Projects" />
          <DataGrid
            rows={data}
            columns={columns}
            pageSizeOptions={[10, 25, 50]}
            paginationModel={paginationModel}
            disableColumnMenu
            disableColumnFilter
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
