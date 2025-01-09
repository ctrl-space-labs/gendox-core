
import { useCallback } from "react";


export const simulateStatusUpdates = useCallback(() => {
    setStatusMessage("Gathering local contacts...");
    setTimeout(() => {
      setStatusMessage("Searching for related documents...");
      setTimeout(() => {
        setStatusMessage("Generating answer...");
      }, 2000);
    }, 2000);
  }, []);