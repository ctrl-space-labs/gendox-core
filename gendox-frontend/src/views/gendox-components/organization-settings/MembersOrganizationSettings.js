import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { visuallyHidden } from "@mui/utils";
import { alpha } from "@mui/material/styles";
import { useSettings } from "src/@core/hooks/useSettings";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import Icon from "src/@core/components/icon";
import authConfig from "src/configs/auth";
import organizationService from "src/gendox-sdk/organizationService";
import userService from "src/gendox-sdk/userService";
import SendInvitation from "src/views/gendox-components/organization-settings/SendInvitation";

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
    id: "is-organization-member",
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
          Organization Members
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

const MembersOrganizationSettings = () => {
  const router = useRouter();
  const { organizationId } = router.query;
  const { settings } = useSettings();
  const isDemo = settings.isDemo;
  const organization = useSelector((state) => state.activeOrganization.activeOrganization);
  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );

  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("name");
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [organizationMembers, setOrganizationMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showInviteButton, setShowInviteButton] = useState(true);
  const [sendInvitationOpen, setSendInvitationOpen] = useState(false)
  const toggleSendInvitation = () => setSendInvitationOpen(!sendInvitationOpen)

  useEffect(() => {
    if (organizationId) {
      fetchOrganizationMembers();
    }
  }, [organizationId, router]);

  const fetchOrganizationMembers = async () => {
    try {
      const response = await organizationService.getUsersInOrganizationByOrgId(
        organizationId,
        storedToken
      );
      const fetchedOrganizationMembers = response.data.map((user) => ({
        ...user.user,
        userType: user.user.userType.name,
        activeOrganizationMember: true,
      }));
      setOrganizationMembers(fetchedOrganizationMembers);      
    } catch (error) {
      console.error("Failed to fetch organization members:", error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await userService.getAllUsers( 
        organizationId,      
        storedToken
      );
      console.log("response", response);
      const fetchedAllUsers = response.data.map((user) => ({
        ...user.user,
        userType: user.user.userType.name,
        activeOrganizationMember: false,
      }));
      // Filter out organization members who are already project members
      const organizationMemberIds = new Set(organizationMembers.map((om) => om.id));
      const filteredAllUsers = fetchedAllUsers.filter(
        (us) => !organizationMemberIds.has(us.id)
      );

      setAllUsers(filteredAllUsers);
      setShowInviteButton(false);
    } catch (error) {
      console.error("Failed to fetch users:", error);
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
      ? Math.max(0, (1 + page) * rowsPerPage - organizationMembers.length)
      : 0;

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent the default form submission
    if (!selected.length) {
      console.log("No users selected.");
      return;
    }

    const userTypePayload = {
      id: 4
    }

    const newUserOrganizationPayload = {      
      organization: organization,
      user: selected,
      type: userTypePayload
    };

    try {
      const response = await organizationService.addOrganizationMember(
        organizationId,
        newUserOrganizationPayload,
        storedToken
      );
      console.log("Update successful", response);
      setShowInviteButton(true);
      setOrganizationMembers([]);
      setAllUsers([]);
      setSelected([]);
      const path = `/gendox/organization-settings?organizationId=${organizationId}`;
      router.push(path);
    } catch (error) {
      console.error("Failed to update organization", error);
    }
  };

  // not used
  const handleInviteNewMembers = (event) => {
    event.preventDefault(); // This prevents the form from submitting.
    fetchAllUsers();
    setShowInviteButton(false);
  };

  const handleInviteNewMember = (event) => {
    event.preventDefault(); // This prevents the form from submitting.
    setSendInvitationOpen(true);
    };

  const handleBack = (event) => {
    event.preventDefault(); // This prevents the form from submitting.
    setShowInviteButton(true); // Reset to show the invite button again
    setAllUsers([]); // Optionally clear the users 
  };

  const membersToShow = showInviteButton ? organizationMembers: allUsers;
  const showProjectMemberColumn = !showInviteButton;

  return (
    <Card>
      <CardHeader title="Organization Settings" />
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
                            onClick={(event) => handleClick(event, row.id)}
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
                                {row.activeOrganizationMember ? "Yes" : "No"}
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
            <Tooltip title={isDemo ? "Feature not available in demo mode" : ""}>
              <span>                
                <Button
                  size="large"
                  variant="contained"
                  component="a"
                  onClick={handleInviteNewMember}
                  target="_blank"
                  rel="noopener noreferrer"
                  disabled={isDemo} 
                >
                  Invite new members
                </Button>
              </span>
            </Tooltip>   
            
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
      <SendInvitation open={sendInvitationOpen} toggle={toggleSendInvitation} />

    </Card>
  );
};

export default MembersOrganizationSettings;
