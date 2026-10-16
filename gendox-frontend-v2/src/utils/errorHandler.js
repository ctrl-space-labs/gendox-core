export const getErrorMessage = (error) => {
    return (
      error.response?.data?.errorMessage || // Custom error message from the server
      error.response?.statusText || // Default status text (e.g., "Not Found")
      error.message || // Generic Axios error message
      "An unexpected error occurred" // Fallback message
    );
  };
  
  