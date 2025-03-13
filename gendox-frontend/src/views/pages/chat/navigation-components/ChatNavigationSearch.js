import React from "react";
import { Box, TextField, InputAdornment } from "@mui/material";
import Icon from "src/views/custom-components/mui/icon/icon";

const ChatNavigationSearch = ({ searchQuery, setSearchQuery }) => {
  return (
    <Box sx={{ mb: 2 }}>
      <TextField
        variant="outlined"
        placeholder="Search Agent"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        size="small"
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Icon icon="mdi:search" />
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};

export default ChatNavigationSearch;
