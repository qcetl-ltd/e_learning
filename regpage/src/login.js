import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaFacebook, FaMicrosoft } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useEffect} from "react"; 


const SignIn = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate(); // Initialize navigation

  // Handle input field changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submit with API authentication
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const response = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        localStorage.setItem("user", JSON.stringify({ email: data.email, token: data.token }));
        alert("Login Successful!");
        navigate("/LoginDashboard");
      } else {
        alert(`Error: ${data.detail || "Invalid credentials"}`);
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Something went wrong. Please try again.");
    }
  };
  

  // Handle SSO Login
  const handleSSOLogin = (provider) => {
  window.location.href = `http://127.0.0.1:8000/login/${provider}`;
};

useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("jwt_token"); // Expecting JWT token from the backend

  if (token) {
    // Store JWT token in localStorage and navigate
    localStorage.setItem("user", JSON.stringify({ token }));
    alert("Login Successful!");
    navigate("/LoginDashboard");
  }
}, [navigate]);

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card p-4 shadow" style={{ width: "350px" }}>
        <h2 className="text-center">Sign In</h2>
        <p className="text-center text-muted">
          Not registered yet?{" "}
          <span
            className="text-primary"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </span>
        </p>

        {/* SSO Buttons */}
        <button className="btn btn-danger w-100 my-2" onClick={() => handleSSOLogin("google")}>
          <FcGoogle className="me-2 bg-white rounded-circle p-1" />
          Continue with Google
        </button>

        <button className="btn btn-primary w-100 my-2" onClick={() => handleSSOLogin("facebook")}>
          <FaFacebook className="me-2" />
          Continue with Facebook
        </button>

        <button className="btn btn-dark w-100 my-2" onClick={() => handleSSOLogin("microsoft")}>
          <FaMicrosoft className="me-2 bg-white rounded-circle p-1" size={20} />
          Continue with Microsoft
        </button>

        <div className="d-flex align-items-center my-3">
          <div className="flex-grow-1 border-top"></div>
          <span className="px-2 text-muted">or</span>
          <div className="flex-grow-1 border-top"></div>
        </div>

        {/* Email/Password Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Email:</label>
            <input
              type="email"
              name="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              placeholder="Your@example.com"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Password:</label>
            <input
              type="password"
              name="password"
              className="form-control"
              value={formData.password}
              onChange={handleChange}
              placeholder="Type here"
              required
            />
          </div>

          <button type="submit" className="btn btn-warning w-100">
            SIGN IN
          </button>

          <p className="text-center mt-2">
            <a href="/forgot-password" className="text-primary">Forgot password?</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignIn;
