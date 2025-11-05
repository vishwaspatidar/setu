// frontend/src/util/ApiCall.jsx
import axios from "axios";
import { toast } from "react-toastify";

const API = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL || "",
  withCredentials: true,
});

// persistent header: if a token exists in localStorage, attach it
if (typeof window !== "undefined") {
  const storedToken = localStorage.getItem("token");
  if (storedToken) {
    API.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
  }
}

const ApiCall = async (url, method, navigate, setUser, data) => {
  console.log("******** Inside ApiCall function ********");

  if (method === "GET") {
    try {
      const response = await API.get(url);
      return response.data;
    } catch (error) {
      console.error("Error in API call:", error);
      setUser && setUser(null);
      const status = error?.response?.status;
      if (status === 401) {
        toast.error("You are not authorized to access this page. Please login first.");
        navigate && navigate("/login");
      } else if (status === 404) {
        toast.error("The requested resource was not found.");
        navigate && navigate("/");
      } else if (status === 500) {
        toast.error("Server Error. Please try again later.");
        navigate && navigate("/");
      } else {
        toast.error("An error occurred. Please try again later.");
        navigate && navigate("/");
      }
    }
  } else if (method === "POST") {
    try {
      const response = await API.post(url, data);
      return response.data;
    } catch (error) {
      console.error("Error in API call:", error);
      setUser && setUser(null);
      const status = error?.response?.status;
      if (status === 401) {
        toast.error("You are not authorized to access this page. Please login first.");
        navigate && navigate("/login");
      } else if (status === 404) {
        toast.error("The requested resource was not found.");
        navigate && navigate("/");
      } else if (status === 500) {
        toast.error("Server Error. Please try again later.");
        navigate && navigate("/");
      } else {
        toast.error("An error occurred. Please try again later.");
        navigate && navigate("/");
      }
    }
  }
};

export default ApiCall;
export { API };
