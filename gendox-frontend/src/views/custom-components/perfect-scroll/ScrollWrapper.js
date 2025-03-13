import {Box} from "@mui/material";
import PerfectScrollbar from "react-perfect-scrollbar";
import React, {forwardRef} from "react";


const styles = {
  height: "100%",
  '& .MuiMenuItem-root:last-of-type': {
    border: 0
  }
}


const ScrollWrapper = forwardRef(({ children, hidden }, ref) => {
  if (hidden) {
    return (
      <Box
        ref={ref}
        sx={{
          ...styles,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {children}
      </Box>
    );
  } else {
    return (
      <PerfectScrollbar
        // Wrap the forwarded ref in a callback
        containerRef={(node) => {
          if (ref) {
            if (typeof ref === "function") {
              ref(node);
            } else {
              ref.current = node;
            }
          }
        }}
        options={{ wheelPropagation: false, suppressScrollX: true }}
      >
        {children}
      </PerfectScrollbar>
    );
  }
});


export default ScrollWrapper;
