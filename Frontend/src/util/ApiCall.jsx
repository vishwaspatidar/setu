import { toast } from "react-toastify";
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL || "",
  withCredentials: true, // include cookies for auth flows
});

const ApiCall = async (url, method, navigate, setUser, data) => {
  console.log("******** Inside ApiCall function ********");

  const safeErrorStatus = (err) => (err && err.response && err.response.status) || null;

  if (method === "GET") {
    try {
      const response = await API.get(url);
      return response.data;
    } catch (error) {
      console.error("Error in API call:", error);
      setUser && setUser(null);
      const status = safeErrorStatus(error);
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
      const status = safeErrorStatus(error);
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
        // show server-provided message if available, otherwise generic
        const msg = (error && error.response && error.response.data && (error.response.data.message || error.response.data.error)) || "An error occurred. Please try again later.";
        toast.error(msg);
        navigate && navigate("/");
      }
    }
  }
};

export default ApiCall;
