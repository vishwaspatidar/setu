// frontend/src/pages/login/login.jsx
import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import { FaGoogle } from "react-icons/fa";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { API } from "../../util/ApiCall.jsx";

const Login = () => {
  const [isHovered, setIsHovered] = useState(false); // State for hover effect
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
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
      const token = res?.data?.data?.token || res?.data?.token || (res?.data && res.data.data && res.data.data.token);
      if (token) {
        localStorage.setItem("token", token);
        API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }

      const message = res?.data?.message || res?.data?.msg || "Login successful";
      toast.success(message);

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
    minHeight: "90.4vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2d2d2d",
  };

  const loginBoxStyle = {
    width: "420px",
    display: "flex",
    backgroundColor: "#2d2d2d",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "20px",
    border: "1px solid #fcaaa8",
    borderRadius: "10px",
    boxShadow: "10px 10px 10px #5c4242",
    zIndex: "999",
  };

  const titleStyle = {
    fontSize: "50px",
    fontFamily: "Oswald, sans-serif",
    color: "#fcaaa8",
    textAlign: "center",
  };

  const imageStyle = {
    position: "absolute",
    left: "10px",
    top: "80px",
    width: "400px",
    marginBottom: "20px",
  };

  const imageBelowStyle = {
    position: "absolute",
    right: "10px",
    bottom: "50px",
    width: "400px",
    marginBottom: "20px",
  };

  return (
    <div style={containerStyle}>
      <img src={"/assets/images/1.png"} alt="Above Image" style={imageStyle} />
      <div style={loginBoxStyle}>
        <h1 style={titleStyle}>LOGIN</h1>

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
                backgroundColor: "#f56664",
                color: "#fff",
                fontFamily: "Montserrat",
                border: "none",
                padding: "10px 20px",
                borderRadius: "5px",
                cursor: "pointer",
                width: "160px",
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
