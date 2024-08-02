// ** React Imports
import { useState, useEffect, forwardRef } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";

// ** MUI Imports
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Dialog from "@mui/material/Dialog";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import { styled } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import InputLabel from "@mui/material/InputLabel";
import Typography from "@mui/material/Typography";
import Fade from "@mui/material/Fade";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Autocomplete from "@mui/material/Autocomplete";

// ** Icon Imports
import Icon from "src/@core/components/icon";

// ** Config Import
import themeConfig from "src/configs/themeConfig";
import authConfig from "src/configs/auth";

// ** Custom Components Imports
import CustomAvatar from "src/@core/components/mui/avatar";
import invitationService from "src/gendox-sdk/invitationService";
import userService from "src/gendox-sdk/userService";
import { set } from "nprogress";
import toast from "react-hot-toast";


const Transition = forwardRef(function Transition(props, ref) {
  return <Fade ref={ref} {...props} />;
});

const InviteDialog = ({ open, handleClose }) => {
  const router = useRouter();
  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );
  const project = useSelector((state) => state.activeProject.projectDetails);
  const { id: projectId, organizationId } = project;
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [publicUsers, setPublicUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  

  const validateEmail = (email) => {
    // Simple email validation regex
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  useEffect(() => {
    fetchAllPublicUsers();
  }, []);

  const fetchAllPublicUsers = async () => {
    try {
      const response = await userService.getPublicUsers(storedToken);
      const usersWithEmails = response.data.content.filter(
        (user) => user.email !== null
      );
      setPublicUsers(usersWithEmails);
    } catch (error) {
      console.error("Failed to fetch public users", error);
    }
  };

  const handleInvitation = async () => {
    if (!email) {
      setError("Email is required.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError(""); // Clear any existing error

    const invitationBody = {
      inviteeEmail: email,
      projectId,
      organizationId,
      userRoleType: {
        name: "ROLE_EDITOR",
      },
      userId: selectedUserId,
    };

    console.log("Invitation Body", invitationBody);

    try {
      await invitationService.inviteProjectMember(
        organizationId,
        storedToken,
        invitationBody
      );
      console.log("Invitation Sent");      
      toast.success("Invitation sent successfully!");      
      handleClose(); // Close the dialog on success
    } catch (error) {
      console.error("Failed to send invitation", error);
      setError("Failed to send invitation. Please try again.");
    }
  };

  return (
    <Dialog
      fullWidth
      open={open}
      maxWidth="md"
      scroll="body"
      onClose={handleClose}
      TransitionComponent={Transition}
      onBackdropClick={handleClose}
    >
      <DialogContent
        sx={{
          position: "relative",
          pb: (theme) => `${theme.spacing(8)} !important`,
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
        <IconButton
          size="small"
          onClick={handleClose}
          sx={{ position: "absolute", right: "1rem", top: "1rem" }}
        >
          <Icon icon="mdi:close" />
        </IconButton>
        <Box sx={{ mb: 10, textAlign: "center" }}>
          <Typography variant="h5" sx={{ mb: 1, lineHeight: "2rem" }}>
            Invite new Members
          </Typography>
          <Typography variant="body2">{project.name} project</Typography>
        </Box>
        <Grid container spacing={6} sx={{ textAlign: "center" }}>
          <Grid item sm={4} xs={12}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flexDirection: "column",
              }}
            >
              <CustomAvatar
                skin="light"
                color="primary"
                sx={{
                  mb: 2.5,
                  width: [70, 100],
                  height: [70, 100],
                  "& svg": { fontSize: ["2.2rem", "2.5rem"] },
                }}
              >
                <Icon icon="mdi:message-outline" />
              </CustomAvatar>
              <Typography sx={{ mb: 3, fontWeight: "600" }}>
                Send Invitation 👍🏻
              </Typography>
              <Typography
                variant="body2"
                sx={{ textAlign: "center", maxWidth: "200px" }}
              >
                Send an invitation to your friend
              </Typography>
            </Box>
          </Grid>
          <Grid item sm={4} xs={12}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flexDirection: "column",
              }}
            >
              <CustomAvatar
                skin="light"
                color="primary"
                sx={{
                  mb: 2.5,
                  width: [70, 100],
                  height: [70, 100],
                  "& svg": { fontSize: ["2.2rem", "2.5rem"] },
                }}
              >
                <Icon icon="mdi:clipboard-outline" />
              </CustomAvatar>
              <Typography sx={{ mb: 3, fontWeight: "600" }}>
                Registration 😎
              </Typography>
              <Typography
                variant="body2"
                sx={{ textAlign: "center", maxWidth: "200px" }}
              >
                Let them register to our project
              </Typography>
            </Box>
          </Grid>
          <Grid item sm={4} xs={12}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flexDirection: "column",
              }}
            >
              <CustomAvatar
                skin="light"
                color="primary"
                sx={{
                  mb: 2.5,
                  width: [70, 100],
                  height: [70, 100],
                  "& svg": { fontSize: ["2.2rem", "2.5rem"] },
                }}
              >
                <Icon icon="mdi:license" />
              </CustomAvatar>
              <Typography sx={{ mb: 3, fontWeight: "600" }}>
                Start Using 🎉
              </Typography>
              <Typography
                variant="body2"
                sx={{ textAlign: "center", maxWidth: "200px" }}
              >
                Your friend will can use our project service
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <Divider sx={{ my: "0 !important" }} />
      <DialogContent
        sx={{
          position: "relative",
          pt: (theme) => `${theme.spacing(8)} !important`,
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
        
        <Box sx={{ mb: 8 }}>
          <Typography variant="h6" sx={{ mb: 4, lineHeight: "2rem" }}>
            Invite new Member
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              flexWrap: { xs: "wrap", sm: "nowrap" },
            }}
          >
            <Autocomplete
              freeSolo
              fullWidth
              options={publicUsers}
              getOptionLabel={(option) => option.email}
              filterOptions={
                (options, { inputValue }) =>
                  inputValue
                    ? options.filter((option) =>
                        option.email
                          .toLowerCase()
                          .includes(inputValue.toLowerCase())
                      )
                    : [] // Return an empty array if inputValue is empty
              }
              onInputChange={(event, value) => setEmail(value)}
              onChange={(event, value) => {
                setEmail(value ? value.email : "");
                setSelectedUserId(value ? value.id : null);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  size="small"
                  id="refer-email"
                  sx={{ mr: { xs: 0, sm: 4 } }}
                  placeholder="name@email.com"
                  value={email}
                  error={!!error}
                  helperText={error}
                />
              )}
            />
            <Button
              variant="contained"
              sx={{ mt: { xs: 2, sm: 0 }, ml:5, width: { xs: "100%", sm: "auto" } }}
              onClick={handleInvitation}
            >
              Send
            </Button>
          </Box>
          <InputLabel
            htmlFor="refer-email"
            sx={{
              mt: 4,
              fontSize: "0.875rem",
              lineHeight: "1.25rem",
              display: "inline-flex",
              whiteSpace: "break-spaces",
            }}
          >
            {`Enter your friend’s email address and invite them to join ${project.name} project 😍`}
          </InputLabel>
        </Box>

        
      </DialogContent>
    </Dialog>
  );
};

export default InviteDialog;
