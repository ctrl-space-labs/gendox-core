// ** React Imports
import {useEffect, useMemo, useState} from "react";

import { useRouter } from "next/router";

// ** Config
import authConfig from "src/configs/auth";

// ** MUI Imports
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import Select from "@mui/material/Select";
import Switch from "@mui/material/Switch";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import { styled } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import InputLabel from "@mui/material/InputLabel";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import InputAdornment from "@mui/material/InputAdornment";
import LinearProgress from "@mui/material/LinearProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import DialogContentText from "@mui/material/DialogContentText";
import toast from "react-hot-toast";
import userService from "src/gendox-sdk/userService";
import Alert from "@mui/material/Alert";
// ** Icon Imports
import Icon from "src/@core/components/icon";

// ** Custom Components
import CustomChip from "src/@core/components/mui/chip";
import CustomAvatar from "src/@core/components/mui/avatar";
import DeleteConfirmDialog from "src/utils/dialogs/DeleteConfirmDialog";

// import UserSuspendDialog from 'src/views/apps/user/view/UserSuspendDialog'
// import UserSubscriptionDialog from 'src/views/apps/user/view/UserSubscriptionDialog'

// ** Utils Import
import { getInitials } from "src/@core/utils/get-initials";

import { useAuth } from "src/hooks/useAuth";
import {generateIdenticon} from "src/utils/identiconUtil";



const data = {
  id: 1,
  role: "admin",
  status: "active",
  username: "gslixby0",
  avatarColor: "primary",
  country: "El Salvador",
  company: "Yotz PVT LTD",
  contact: "(479) 232-9151",
  currentPlan: "enterprise",
  fullName: "Daisy Patterson",
  email: "gslixby0@abc.net.au",
  avatar: "/images/avatars/1.png",
};

const roleColors = {
  admin: "error",
  editor: "info",
  author: "warning",
  maintainer: "success",
  subscriber: "primary",
};

const statusColors = {
  active: "success",
  pending: "warning",
  inactive: "secondary",
};

// ** Styled <sup> component
const Sup = styled("sup")(({ theme }) => ({
  top: "0.2rem",
  left: "-0.6rem",
  position: "absolute",
  color: theme.palette.primary.main,
}));

// ** Styled <sub> component
const Sub = styled("sub")({
  fontWeight: 300,
  fontSize: "1rem",
  alignSelf: "flex-end",
});

const UserViewLeft = ({ userData }) => {
  const auth = useAuth();
  const router = useRouter();
  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );

  const { logout } = useAuth();

  let identiconSrc = useMemo(() => generateIdenticon(userData.email), [userData.email]);


  // ** States
  const [openEdit, setOpenEdit] = useState(false);
  const [openPlans, setOpenPlans] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false); 
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  

  // Handle Edit dialog
  const handleEditClickOpen = () => setOpenEdit(true);
  const handleEditClose = () => setOpenEdit(false);

  // Handle Upgrade Plan dialog
  const handlePlansClickOpen = () => setOpenPlans(true);
  const handlePlansClose = () => setOpenPlans(false);

  // Handle Delete dialog
  const handleDeleteClickOpen = () => setOpenDeleteDialog(true);
  const handleDeleteClose = () => setOpenDeleteDialog(false);

  const handleAlertClose = () => setAlertOpen(false);


  const handleLogout = () => {
    logout();
  };


  // Handle Delete User
  const handleDeleteUser = async () => {
    console.log("Attempting to delete user:", userData.id); // Debugging log
    if (!storedToken) {
      toast.error("Authentication token missing.");
      return;
    }
  
    try {
      // Call the API function and pass the user ID and stored token
      await userService.deactivateUserById(userData.id, storedToken);
      setAlertMessage("Account deleted successfully!");
      setAlertOpen(true);
      setOpenDeleteDialog(false);
      
      handleLogout();
      
    } catch (error) {
      console.error("Error deactivating user:", error); // Log the error for debugging
      setAlertMessage("Failed to delete the user account!");
      setAlertOpen(true);
    } finally {
      handleDeleteClose(); // Close the delete confirmation dialog
    }
  };
  



  if (userData) {
    return (
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Card sx={{
              boxShadow: "none",
              border: (theme) => `2px solid ${theme.palette.primary.main}`,
            }} >
            <CardContent
              sx={{
                pt: 15,
                display: "flex",
                alignItems: "center",
                flexDirection: "column",
              }}
            >
              {data.avatar ? (
                <CustomAvatar
                  src={identiconSrc}
                  variant="rounded"
                  alt={userData.name}
                  sx={{ width: 120, height: 120, fontWeight: 600, mb: 4 }}
                />
              ) : (
                <CustomAvatar
                  skin="light"
                  variant="rounded"
                  color={data.avatarColor}
                  sx={{
                    width: 120,
                    height: 120,
                    fontWeight: 600,
                    mb: 4,
                    fontSize: "3rem",
                  }}
                >
                  {getInitials(userData.name)}
                </CustomAvatar>
              )}
              <Typography variant="h6" sx={{ mb: 2 }}>
                {userData.name}
              </Typography>
              <CustomChip
                skin="light"
                size="small"
                label={userData.role}
                color={roleColors[userData.role]}
                sx={{
                  height: 20,
                  fontWeight: 600,
                  borderRadius: "5px",
                  fontSize: "0.875rem",
                  textTransform: "capitalize",
                  "& .MuiChip-label": { mt: -0.25 },
                }}
              />
            </CardContent>

            <CardContent sx={{ my: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Box sx={{ mr: 8, display: "flex", alignItems: "center" }}>
                  <CustomAvatar skin="light" variant="rounded" sx={{ mr: 3 }}>
                    <Icon icon="mdi:domain" />
                  </CustomAvatar>
                  <div>
                    <Typography variant="h6" sx={{ lineHeight: 1.3 }}>
                      {userData.organizations.length}
                    </Typography>
                    <Typography variant="body2">Organizations</Typography>
                  </div>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <CustomAvatar skin="light" variant="rounded" sx={{ mr: 3 }}>
                    <Icon icon="mdi:briefcase-variant-outline" />
                  </CustomAvatar>
                  <div>
                    <Typography variant="h6" sx={{ lineHeight: 1.3 }}>
                      {userData.organizations.reduce((acc, organization) => {
                        return (
                          acc +
                          (organization.projects
                            ? organization.projects.length
                            : 0)
                        );
                      }, 0)}
                    </Typography>
                    <Typography variant="body2">Projects </Typography>
                  </div>
                </Box>
              </Box>
            </CardContent>

            <CardContent>
              <Typography variant="h6">Details</Typography>
              <Divider
                sx={{ mt: (theme) => `${theme.spacing(4)} !important` }}
              />
              <Box sx={{ pt: 2, pb: 1 }}>
                <Box sx={{ display: "flex", mb: 2.7 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ mr: 2, color: "text.primary" }}
                  >
                    Username:
                  </Typography>
                  <Typography variant="body2">@{userData.userName}</Typography>
                </Box>
                <Box sx={{ display: "flex", mb: 2.7 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ mr: 2, color: "text.primary" }}
                  >
                    Billing Email:
                  </Typography>
                  <Typography variant="body2">{userData.email}</Typography>
                </Box>
                <Box sx={{ display: "flex", mb: 2.7 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ mr: 2, color: "text.primary" }}
                  >
                    Status:
                  </Typography>
                  <CustomChip
                    skin="light"
                    size="small"
                    label={data.status}
                    color={statusColors[data.status]}
                    sx={{
                      height: 20,
                      fontWeight: 500,
                      fontSize: "0.75rem",
                      borderRadius: "5px",
                      textTransform: "capitalize",
                    }}
                  />
                </Box>
                <Box sx={{ display: "flex", mb: 2.7 }}>
                  <Typography
                    sx={{ mr: 2, fontWeight: 500, fontSize: "0.875rem" }}
                  >
                    Role:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ textTransform: "capitalize" }}
                  >
                    {userData.role}
                  </Typography>
                </Box>
                
                <Box sx={{ display: "flex", mb: 2.7 }}>
                  <Typography
                    sx={{ mr: 2, fontWeight: 500, fontSize: "0.875rem" }}
                  >
                    User Type:
                  </Typography>
                  <Typography variant="body2"> {userData.userTypeId}</Typography>
                </Box>
                
              </Box>
            </CardContent>

            <CardActions sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="contained"
                sx={{ mr: 2 }}
                onClick={handleEditClickOpen}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={handleDeleteClickOpen} 
              >
                Delete
              </Button>
          </CardActions>

            <Dialog
              open={openEdit}
              onClose={handleEditClose}
              aria-labelledby="user-view-edit"
              aria-describedby="user-view-edit-description"
              sx={{ "& .MuiPaper-root": { width: "100%", maxWidth: 650 } }}
            >
              <DialogTitle
                id="user-view-edit"
                sx={{
                  textAlign: "center",
                  fontSize: "1.5rem !important",
                  px: (theme) => [
                    `${theme.spacing(5)} !important`,
                    `${theme.spacing(15)} !important`,
                  ],
                  pt: (theme) => [
                    `${theme.spacing(8)} !important`,
                    `${theme.spacing(12.5)} !important`,
                  ],
                }}
              >
                Edit User Information
              </DialogTitle>
              <DialogContent
                sx={{
                  pb: (theme) => `${theme.spacing(8)} !important`,
                  px: (theme) => [
                    `${theme.spacing(5)} !important`,
                    `${theme.spacing(15)} !important`,
                  ],
                }}
              >
                <DialogContentText
                  variant="body2"
                  id="user-view-edit-description"
                  sx={{ textAlign: "center", mb: 7 }}
                >
                  {/* Updating user details will receive a privacy audit. */}
                  This feature is not available yet. We're working hard to get it up and running soon. Stay tuned!
                </DialogContentText>
                {/* <form>
                  <Grid container spacing={6}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        defaultValue={data.fullName}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Username"
                        defaultValue={data.username}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">@</InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="email"
                        label="Billing Email"
                        defaultValue={data.email}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel id="user-view-status-label">
                          Status
                        </InputLabel>
                        <Select
                          label="Status"
                          defaultValue={data.status}
                          id="user-view-status"
                          labelId="user-view-status-label"
                        >
                          <MenuItem value="pending">Pending</MenuItem>
                          <MenuItem value="active">Active</MenuItem>
                          <MenuItem value="inactive">Inactive</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="TAX ID"
                        defaultValue="Tax-8894"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Contact"
                        defaultValue={`+1 ${data.contact}`}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel id="user-view-language-label">
                          Language
                        </InputLabel>
                        <Select
                          label="Language"
                          defaultValue="English"
                          id="user-view-language"
                          labelId="user-view-language-label"
                        >
                          <MenuItem value="English">English</MenuItem>
                          <MenuItem value="Spanish">Spanish</MenuItem>
                          <MenuItem value="Portuguese">Portuguese</MenuItem>
                          <MenuItem value="Russian">Russian</MenuItem>
                          <MenuItem value="French">French</MenuItem>
                          <MenuItem value="German">German</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel id="user-view-country-label">
                          Country
                        </InputLabel>
                        <Select
                          label="Country"
                          defaultValue="USA"
                          id="user-view-country"
                          labelId="user-view-country-label"
                        >
                          <MenuItem value="USA">USA</MenuItem>
                          <MenuItem value="UK">UK</MenuItem>
                          <MenuItem value="Spain">Spain</MenuItem>
                          <MenuItem value="Russia">Russia</MenuItem>
                          <MenuItem value="France">France</MenuItem>
                          <MenuItem value="Germany">Germany</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        label="Use as a billing address?"
                        control={<Switch defaultChecked />}
                        sx={{ "& .MuiTypography-root": { fontWeight: 500 } }}
                      />
                    </Grid>
                  </Grid>
                </form> */}
              </DialogContent>
              <DialogActions
                sx={{
                  justifyContent: "center",
                  px: (theme) => [
                    `${theme.spacing(5)} !important`,
                    `${theme.spacing(15)} !important`,
                  ],
                  pb: (theme) => [
                    `${theme.spacing(8)} !important`,
                    `${theme.spacing(12.5)} !important`,
                  ],
                }}
              >
                {/* <Button
                  variant="contained"
                  sx={{ mr: 2 }}
                  onClick={handleEditClose}
                >
                  Submit
                </Button> */}
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleEditClose}
                >
                  Cancel
                </Button>
              </DialogActions>
            </Dialog>
            
          </Card>
        </Grid>
          {/* Delete Confirmation Dialog */}
          <DeleteConfirmDialog
            open={openDeleteDialog}
            onClose={handleDeleteClose}
            onConfirm={handleDeleteUser}
            title="Confirm User Deletion"
            contentText={`Are you sure you want to delete ${userData.name}? You will lose access to all organizations and documents. This action cannot be undone.`}
            confirmButtonText="Delete Account"
            cancelButtonText="Cancel"
          />
      </Grid>
    );
  } else {
    return null;
  }
};

export default UserViewLeft;
