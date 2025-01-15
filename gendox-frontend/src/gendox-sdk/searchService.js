import axios from "axios";
import apiRequests from "src/configs/apiRequest";

const postSearchMessage = async (message, projectId, size, storedToken) => {
  let headers = {
    "Content-Type": "application/json",
  };

  if (storedToken) {
    headers.Authorization = "Bearer " + storedToken;
  }

  return axios.post(
    apiRequests.postSearchModel(projectId, size),
    {
      value: message,
    },
    { headers }
  );
};

export default {
  postSearchMessage,
};
