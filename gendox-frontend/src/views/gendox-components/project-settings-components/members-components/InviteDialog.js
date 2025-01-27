// ** React Imports
import { useState, useEffect, forwardRef } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Dialog from "@mui/material/Dialog";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import InputLabel from "@mui/material/InputLabel";
import Typography from "@mui/material/Typography";
import Fade from "@mui/material/Fade";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Autocomplete from "@mui/material/Autocomplete";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip"; 
import Icon from "src/@core/components/icon";
import authConfig from "src/configs/auth";
import CustomAvatar from "src/@core/components/mui/avatar";
import invitationService from "src/gendox-sdk/invitationService";
import toast from "react-hot-toast";
import { useAuth } from "src/hooks/useAuth";
import { getErrorMessage } from "src/utils/errorHandler";


const Transition = forwardRef(function Transition(props, ref) {
  return <Fade ref={ref} {...props} />;
});

const InviteDialog = ({ open, handleClose, organizationMembers }) => {
  const router = useRouter();
  const auth = useAuth();
  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );
  const project = useSelector((state) => state.activeProject.projectDetails);
  const { id: projectId, organizationId } = project;
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  const members = organizationMembers.filter(
    (member) => member.user.email !== null
  );

  const validateEmail = (email) => {
    // Simple email validation regex
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
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

    const existingMember = members.find(
      (member) => member.user.email === email
    );

    const invitationBody = {
      inviteeEmail: email,
      projectId,
      organizationId,
      userRoleType: existingMember
        ? { name: existingMember.role.name }
        : { name: selectedRole },
      inviterUserId: auth.user.id,
    };

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
      handleClose();
      toast.error(`Error sending invitation Error: ${getErrorMessage(error)}`);      
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
              options={members.map((member) => member.user.email)}
              onInputChange={(event, value) => {
                setEmail(value);
                if (error) {
                  setError(""); // Clear the error when the user starts typing
                }
              }}
              onChange={(event, value) => {
                setEmail(value || "");
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
            <Tooltip
              title={
                members.some((member) => member.user.email === email)
                  ? "Role selection is disabled because the email already exists."
                  : ""
              }
            >
              <span>
                <Select
                  value={
                    members.some((member) => member.user.email === email)
                      ? ""
                      : selectedRole
                  } // Set value to empty string if disabled
                  onChange={(e) => setSelectedRole(e.target.value)}
                  sx={{ mt: { xs: 2, sm: 0 }, ml: 2, minWidth: 150 }}
                  size="small"
                  disabled={members.some(
                    (member) => member.user.email === email
                  )} // Disable if the email exists
                  displayEmpty
                >
                  <MenuItem value="ROLE_EDITOR">EDITOR</MenuItem>
                  <MenuItem value="ROLE_READER">READER</MenuItem>
                  <MenuItem value="ROLE_ADMIN">ADMIN</MenuItem>
                </Select>
              </span>
            </Tooltip>
            <Button
              variant="contained"
              sx={{
                mt: { xs: 2, sm: 0 },
                ml: 5,
                width: { xs: "100%", sm: "auto" },
              }}
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
