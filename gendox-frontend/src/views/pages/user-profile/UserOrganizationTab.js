import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";
import { DataGrid } from "@mui/x-data-grid";
import LinearProgress from "@mui/material/LinearProgress";
import Grid from "@mui/material/Grid";
import { useRouter } from 'next/router'
import Icon from 'src/views/custom-components/mui/icon/icon';

const columns = [
  {
    flex: 0.3,
    minWidth: 230,
    field: "name",
    headerName: "ORGANIZATION",
    renderCell: ({ row }) => (
      <Box sx={{ display: "flex", alignItems: "center", }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            mx: 2,
          }}
        >
          <Icon icon="mdi:domain" />
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
    flex: 0.15,
    minWidth: 200,
    headerName: "PROJECTS",    
    field: "projectLength",
    sortable: false,
    renderCell: ({ row }) => (
      <Box sx={{ width: "100%" }}>
        <Typography variant="body2">{row.projects.length}</Typography>
        <LinearProgress
          variant="determinate"
          value={row.projects.length}
          sx={{ height: "0.25rem", mt: 1, borderRadius: "5px" }}
        />
      </Box>
    ),
  },
  {
    flex: 0.15,
    minWidth: 100,
    field: "address",
    headerName: "ADDRESS",
    renderCell: ({ row }) => (
      <Typography variant="body2">{row.address}</Typography>
    ),
  },
  {
    flex: 0.15,
    minWidth: 100,
    field: "phone",
    headerName: "PHONE",
    renderCell: ({ row }) => (
      <Typography variant="body2">{row.phone}</Typography>
    ),
  },

];

const UserOrganizationTab = ({ userData }) => {
  const router = useRouter();
  // ** State
  const [value, setValue] = useState("");
  const [data, setData] = useState(userData.organizations);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });


  const handleRowClick = (params) => {
    const organizationId = params.row.id;
    router.push(`/gendox/home/?organizationId=${organizationId}`);
};


  useEffect(() => {
    setData(userData.organizations);
  }, [value, userData.organizations]);

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardHeader title="Your Organizations" />
          <DataGrid
            rows={data}
            columns={columns}
            disableRowSelectionOnClick
            disableColumnFilter
            disableColumnMenu
            pageSizeOptions={[10, 25, 50]}
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

export default UserOrganizationTab;
