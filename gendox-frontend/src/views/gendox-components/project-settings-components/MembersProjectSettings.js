import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { visuallyHidden } from "@mui/utils";
import {
  alpha,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Checkbox,
  Divider,
  Grid,
  IconButton,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import Icon from "src/@core/components/icon";
import authConfig from "src/configs/auth";
import projectService from "src/gendox-sdk/projectService";
import organizationService from "src/gendox-sdk/organizationService";

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }

  return 0;
}

function getComparator(order, orderBy) {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

// This method is created for cross-browser compatibility, if you don't
// need to support IE11, you can use Array.prototype.sort() directly
function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;

    return a[1] - b[1];
  });

  return stabilizedThis.map((el) => el[0]);
}

const headCells = [
  { id: "name", numeric: false, disablePadding: true, label: "Name" },
  { id: "userName", numeric: true, disablePadding: false, label: "Username" },
  { id: "email", numeric: true, disablePadding: false, label: "Email" },
  { id: "user-type", numeric: true, disablePadding: false, label: "User Type" },
  {
    id: "is-project-member",
    numeric: true,
    disablePadding: false,
    label: "Plan",
  },
];

function EnhancedTableHead(props) {
  // ** Props
  const {
    onSelectAllClick,
    order,
    orderBy,
    numSelected,
    rowCount,
    onRequestSort,
    showProjectMemberColumn,
  } = props;

  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        {/* {headCells.map((headCell) => ( */}
        {headCells
          .filter(
            (cell) => showProjectMemberColumn || cell.id !== "isProjectMember"
          )
          .map((headCell) => (
            <TableCell
              key={headCell.id}
              align={headCell.numeric ? "right" : "left"}
              padding={headCell.disablePadding ? "none" : "normal"}
              sortDirection={orderBy === headCell.id ? order : false}
            >
              <TableSortLabel
                active={orderBy === headCell.id}
                onClick={createSortHandler(headCell.id)}
                direction={orderBy === headCell.id ? order : "asc"}
              >
                {headCell.label}
                {orderBy === headCell.id ? (
                  <Box component="span" sx={visuallyHidden}>
                    {order === "desc"
                      ? "sorted descending"
                      : "sorted ascending"}
                  </Box>
                ) : null}
              </TableSortLabel>
            </TableCell>
          ))}
        {showProjectMemberColumn && (
          <TableCell padding="checkbox">
            <Checkbox
              onChange={onSelectAllClick}
              checked={rowCount > 0 && numSelected === rowCount}
              inputProps={{ "aria-label": "select all users" }}
              indeterminate={numSelected > 0 && numSelected < rowCount}
            />
          </TableCell>
        )}
      </TableRow>
    </TableHead>
  );
}

const EnhancedTableToolbar = (props) => {
  // ** Prop
  const { numSelected } = props;

  return (
    <Toolbar
      sx={{
        px: (theme) => `${theme.spacing(5)} !important`,
        ...(numSelected > 0 && {
          bgcolor: (theme) =>
            alpha(
              theme.palette.primary.main,
              theme.palette.action.activatedOpacity
            ),
        }),
      }}
    >
      {numSelected > 0 ? (
        <Typography
          sx={{ flex: "1 1 100%" }}
          color="inherit"
          variant="subtitle1"
          component="div"
        >
          {numSelected} selected
        </Typography>
      ) : (
        <Typography
          sx={{ flex: "1 1 100%" }}
          variant="h6"
          id="tableTitle"
          component="div"
        >
          Project Members
        </Typography>
      )}
      {numSelected > 0 ? (
        <Tooltip title="Delete">
          <IconButton sx={{ color: "text.secondary" }}>
            <Icon icon="mdi:delete-outline" />
          </IconButton>
        </Tooltip>
      ) : null}
    </Toolbar>
  );
};

const MembersProjectSettings = () => {
  const router = useRouter();
  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );
  const project = useSelector((state) => state.activeProject.activeProject);
  const { id: projectId, organizationId } = project;

  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("name");
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [organizationMembers, setOrganizationMembers] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);  
  const [showInviteButton, setShowInviteButton] = useState(true); 

  
  useEffect(() => {
    if (projectId) {
      fetchProjectMembers();
    }
  }, [projectId, organizationId, router]);

  const fetchProjectMembers = async () => {
    try {
      const response = await projectService.getProjectMembers(
        organizationId,
        projectId,
        storedToken
      );
      const fetchedProjectMembers = response.data.map((user) => ({
        ...user.user,
        userType: user.user.userType.name,
        activeProjectMember: true,
      }));
      setProjectMembers(fetchedProjectMembers);
    } catch (error) {
      console.error("Failed to fetch project members:", error);
    }
  };

  const fetchOrganizationMembers = async () => {
    try {
      const response = await organizationService.getUsersInOrganizationByOrgId(
        organizationId,
        projectId,
        storedToken
      );
      const fetchedOrgMembers = response.data.map((user) => ({
        ...user.user,
        userType: user.user.userType.name,
        activeProjectMember: false,
      }));
      // Filter out organization members who are already project members
      const projectMemberIds = new Set(projectMembers.map(pm => pm.id));
      const filteredOrgMembers = fetchedOrgMembers.filter(om => !projectMemberIds.has(om.id));

      setOrganizationMembers(filteredOrgMembers);
      setShowInviteButton(false);
    } catch (error) {
      console.error("Failed to fetch organization members:", error);
    }
  };

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
        const newSelected = membersToShow.map((n) => n.id);
        setSelected(newSelected);
        return;
    }
    setSelected([]);
};

  const handleClick = (event, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
        newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
        newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
        newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
        newSelected = newSelected.concat(
            selected.slice(0, selectedIndex),
            selected.slice(selectedIndex + 1)
        );
    }

    setSelected(newSelected);
};

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const isSelected = (name) => selected.indexOf(name) !== -1;

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0
      ? Math.max(0, (1 + page) * rowsPerPage - projectMembers.length)
      : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();  // Prevent the default form submission
    if (!selected.length) {
        console.log("No users selected.");
        return;
    }



    try {
      const response = await projectService.addProjectMember(
        organizationId,
        projectId,
        selected,
        storedToken
      );
      console.log("Update successful", response);
      setShowInviteButton(true);
      setOrganizationMembers([]);
      setProjectMembers([]);
      setSelected([]);
      const path = `/gendox/project-settings?organizationId=${organizationId}&projectId=${projectId}`
      router.push(path);
    } catch (error) {
      console.error("Failed to update project", error);
    }
  };

  const handleInviteNewMembers = (event) => {
    event.preventDefault(); // This prevents the form from submitting.
    fetchOrganizationMembers();
    setShowInviteButton(false);
  };

  const handleBack = (event) => {
    event.preventDefault(); // This prevents the form from submitting.
    setShowInviteButton(true); // Reset to show the invite button again
    setOrganizationMembers([]); // Optionally clear the organization members list
  };

  const membersToShow = showInviteButton ? projectMembers : organizationMembers;
  const showProjectMemberColumn = !showInviteButton;

  return (
    <Card>
      <CardHeader title="Project Settings" />
      {/* <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Project updated successfully!
        </Alert>
      </Snackbar> */}
      <Divider />
      <form onSubmit={handleSubmit}>
        <CardContent>
          <Grid>
            <Paper sx={{ width: "100%", mb: 2 }}>
              <EnhancedTableToolbar numSelected={selected.length} />
              <TableContainer component={Paper}>
                <Table
                  sx={{ minWidth: 750 }}
                  aria-labelledby="tableTitle"
                  size={"medium"}
                >
                  <EnhancedTableHead
                    order={order}
                    orderBy={orderBy}
                    rowCount={membersToShow.length}
                    numSelected={selected.length}
                    onRequestSort={handleRequestSort}
                    onSelectAllClick={handleSelectAllClick}
                    showProjectMemberColumn={showProjectMemberColumn}
                  />
                  <TableBody>
                    {/* if you don't need to support IE11, you can replace the `stableSort` call with: rows.slice().sort(getComparator(order, orderBy)) */}
                    {stableSort(membersToShow, getComparator(order, orderBy))
                      .slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage
                      )
                      .map((row, index) => {
                        const isItemSelected = isSelected(
                          row.name || row.userName
                        );
                        const labelId = `enhanced-table-checkbox-${index}`;

                        return (
                          <TableRow
                            hover
                            tabIndex={-1}
                            key={row.id}
                            role="checkbox"
                            selected={isItemSelected}
                            aria-checked={isItemSelected}
                            onClick={(event) =>
                              handleClick(event, row.id)
                            }
                          >
                            <TableCell
                              component="th"
                              id={labelId}
                              scope="row"
                              padding="none"
                            >
                              {row.name}
                            </TableCell>
                            <TableCell align="right">{row.userName}</TableCell>
                            <TableCell align="right">{row.email}</TableCell>
                            <TableCell align="right">{row.userType}</TableCell>
                            {showProjectMemberColumn && (
                              <TableCell align="right">
                                {row.activeProjectMember ? "Yes" : "No"}
                              </TableCell>
                            )}
                            {showProjectMemberColumn && (
                              <TableCell padding="checkbox">
                                <Checkbox
                                  checked={isItemSelected}
                                  inputProps={{ "aria-labelledby": labelId }}
                                />
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    {emptyRows > 0 && (
                      <TableRow
                        sx={{
                          height: 53 * emptyRows,
                        }}
                      >
                        <TableCell colSpan={showProjectMemberColumn ? 6 : 5} />
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                page={page}
                component="div"
                count={membersToShow.length}
                rowsPerPage={rowsPerPage}
                onPageChange={handleChangePage}
                rowsPerPageOptions={[5, 10, 25]}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </Paper>
          </Grid>
        </CardContent>
        <Divider />
        {showInviteButton ? (
          <CardActions sx={{ justifyContent: "flex-end" }}>
            <Button
              type="button"
              size="large"
              onClick={handleInviteNewMembers}
              variant="contained"
            >
              Invite new members
            </Button>
          </CardActions>
        ) : (
          <CardActions>
            <Button
              size="large"
              type="submit"
              sx={{ mr: 2 }}
              onClick={handleSubmit}
              variant="contained"
            >
              Submit
            </Button>
            <Button
              type="reset"
              size="large"
              color="secondary"
              onClick={handleBack}
              variant="outlined"
            >
              Back
            </Button>
          </CardActions>
        )}
      </form>
    </Card>
  );
};

export default MembersProjectSettings;
