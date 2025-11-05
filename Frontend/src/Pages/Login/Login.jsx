import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import { FaGoogle } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const API = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL || "",
  withCredentials: true,
});

const Login = () => {
  const [isHovered, setIsHovered] = useState(false); // State for hover effect
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    // for deployed app, this will use VITE_SERVER_URL if set
    const googleUrl = `${import.meta.env.VITE_SERVER_URL || "http://localhost:8000"}/auth/google`;
    window.location.href = googleUrl;
  };

  const handleLocalSignin = async (e) => {
    e && e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      const res = await API.post("/api/auth/signin", { email, password });

      // Token could be in different shapes depending on backend util
      const token = res?.data?.data?.token || res?.data?.token || (res?.data?.data && res.data.data.token);
      if (token) {
        // store token and set default header for future requests
        localStorage.setItem("token", token);
        API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }

      // Show backend message if provided, otherwise generic success
      const message = res?.data?.message || res?.data?.msg || (res?.data?.data && res.data.message) || "Login successful";
      toast.success(message);

      // navigate after successful login
      navigate("/discover");
    } catch (err) {
      console.error("Login error:", err);
      const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.msg ||
        err?.message ||
        "Login failed";
      toast.error(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    // height: "90.4vh",
    minHeight: "90.4vh",
    // height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2d2d2d",
  };

  const loginBoxStyle = {
    width: "420px",
    // keep height flexible for the added form
    display: "flex",
    backgroundColor: "#2d2d2d",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "20px",
    border: "1px solid #fcaaa8", // Border color
    borderRadius: "10px",
    boxShadow: "10px 10px 10px #5c4242",
    zIndex: "999",
  };

  const titleStyle = {
    fontSize: "50px",
    fontFamily: "Oswald, sans-serif", // Font family
    color: "#fcaaa8", // Text color
    textAlign: "center",
  };

  const buttonStyle = {
    backgroundColor: "#f56664", // Button background color
    color: "#fff", // Button text color
    fontFamily: "Montserrat",
    border: "none",
    padding: "10px 20px",
    borderRadius: "5px",
    cursor: "pointer",
  };

  const imageStyle = {
    position: "absolute",
    left: "10px", // Position the above image to the left
    top: "80px", // Add some space from the top
    width: "400px",
    marginBottom: "20px", // Add margin bottom to create space between image and login box
  };

  const imageBelowStyle = {
    position: "absolute",
    right: "10px", // Position the below image to the right
    bottom: "50px", // Add some space from the bottom
    width: "400px",
    marginBottom: "20px", // Add margin bottom to create space between image and login box
  };

  return (
    <div style={containerStyle}>
      <img src={"/assets/images/1.png"} alt="Above Image" style={imageStyle} />
      <div style={loginBoxStyle}>
        <h1 style={titleStyle}>LOGIN</h1>

        {/* Local email/password login form (minimal) */}
        <form onSubmit={handleLocalSignin} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              padding: "8px",
              borderRadius: "5px",
              border: "1px solid #ccc",
              fontSize: "16px",
            }}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              padding: "8px",
              borderRadius: "5px",
              border: "1px solid #ccc",
              fontSize: "16px",
            }}
            required
          />

          <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "8px" }}>
            <button
              type="submit"
              style={{
                ...buttonStyle,
                width: "160px",
                opacity: loading ? 0.7 : 1,
              }}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <Button
              style={{ width: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}
              variant="light"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={handleGoogleLogin}
            >
              <FaGoogle style={{ marginRight: "8px", color: isHovered ? "#f56664" : "#db4437" }} /> Login with Google
            </Button>
          </div>
        </form>

        <div style={{ textAlign: "center", marginTop: "10px" }}>
          <small style={{ color: "#ccc" }}>
            Don't have an account?{" "}
            <span
              style={{ color: "#fcaaa8", cursor: "pointer", textDecoration: "underline" }}
              onClick={() => navigate("/register")}
            >
              Register
            </span>
          </small>
        </div>
      </div>
      <img src={"/assets/images/2.png"} alt="Below Image" style={imageBelowStyle} />
    </div>
  );
};

export default Login;
