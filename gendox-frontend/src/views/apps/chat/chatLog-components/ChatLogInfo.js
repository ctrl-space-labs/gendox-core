import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Icon from "src/@core/components/icon";


const ChatLogInfo = ({ fakeData }) => {

  return (
    <Box sx={{ display: "flex", flexDirection: "column", mt: 3 }}>
    {fakeData.map((answerInfo, idx) => (
      <Box
        key={idx}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "start",
          mb: 2,
          p: 2,
          borderRadius: 1,
          boxShadow: 1,
          backgroundColor: "background.paper",
        }}
      >
        {/* First Row: User Name */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <Icon icon="mdi:account" fontSize="1rem" sx={{ mr: 1 }} />
          <Typography variant="body2">
            {answerInfo.policyValue.includes("OWNER_NAME")
              ? answerInfo.userName
              : "Secret Owner"}
          </Typography>
        </Box>

        {/* Second Row: Policy Type Name */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <Icon icon="mdi:file-document-outline" fontSize="1rem" sx={{ mr: 1 }} />
          <Typography variant="body2">
            {answerInfo.policyValue.includes("ORIGINAL DOCUMENT")
              ? answerInfo.policyTypeName
              : "Secret"}
          </Typography>
        </Box>

        {/* Third Row: Section Title */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Icon icon="mdi:file-tree-outline" fontSize="1rem" sx={{ mr: 1 }} />
          <Typography variant="body2">
            {answerInfo.policyValue.includes("ORIGINAL DOCUMENT")
              ? answerInfo.sectionTitle
              : "Secret"}
          </Typography>
        </Box>
      </Box>
    ))}
  </Box>
    // <Box sx={{ display: "flex", mt: 3 }}>
    //   {fakeData.map((answerInfo, idx) => (
    //     <Link
    //       key={idx}
    //       href={`/gendox/document-instance/?documentId=${answerInfo.documentId}`}
    //       target="_blank"
    //       rel="noopener noreferrer"
    //       sx={{
    //         ml: { xs: 1, sm: 2, md: idx !== 0 ? 5 : 0 },
    //         color: "primary.main",
    //         textDecoration: "none",
    //         "&:hover": {
    //           textDecoration: "underline",
    //           backgroundColor: "secondary.light",
    //           color: "common.white",
    //         },
    //         p: 1,
    //         borderRadius: 1,
    //         flexGrow: 1,
    //         textAlign: "center",
    //       }}
    //     >
    //       Link-{idx + 1}
    //     </Link>
    //   ))}
    // </Box>
  );
};

export default ChatLogInfo;
