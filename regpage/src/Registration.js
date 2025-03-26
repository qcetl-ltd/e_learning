import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

const SignUp = () => {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateForm = () => {
    let newErrors = {};
    if (!validateEmail(formData.email)) newErrors.email = "Invalid email format";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    if (!formData.username.trim()) newErrors.username = "Username is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setLoading(true);
      setProgress(1);
      let progressInterval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 10 : prev));
      }, 300);
  
      try {
        console.log("Sending request to FastAPI...");
        const response = await fetch("http://127.0.0.1:8000/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            username: formData.username,
            password: formData.password,
          }),
        });
  
        const data = await response.json();
        console.log("Response:", data);
  
        clearInterval(progressInterval);
        setProgress(100);
        setTimeout(() => {
          setLoading(false);
          setProgress(0);
        }, 500);
  
        if (response.ok) {
          alert("User registered successfully!");
          navigate("/");
        } else {
          alert(`Error: ${data.detail}`);
        }
      } catch (error) {
        clearInterval(progressInterval);
        setLoading(false);
        setProgress(0);
        console.error("API request error:", error);
        alert("Something went wrong. Please try again.");
      }
    }
  };
  

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card p-4 shadow" style={{ width: "350px" }}>
        <h2 className="text-center">Sign Up</h2>
        <p className="text-center text-muted">
          Already have an account?{" "}
          <span className="text-primary" style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
            Sign In
          </span>
        </p>

        {loading && (
          <div className="d-flex flex-column align-items-center mb-3">
            <div style={{ width: 100, height: 100, backgroundColor: "black", borderRadius: "50%", padding: 10 }}>
              <CircularProgressbar
                value={progress}
                text={`${progress}%`}
                styles={buildStyles({
                  textColor: "#fff",
                  pathColor: "#fff",  
                  trailColor: "black", 
                  textSize: "18px",
                  strokeLinecap: "round",
                })}
              />
            </div>
            <p className="mt-2 text-white bg-dark px-2 py-1 rounded">Loading...</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Email:</label>
            <input type="email" name="email" className="form-control" value={formData.email} onChange={handleChange} placeholder="your@example.com" required />
            {errors.email && <small className="text-danger">{errors.email}</small>}
          </div>

          <div className="mb-3">
            <label className="form-label">Username:</label>
            <input type="text" name="username" className="form-control" value={formData.username} onChange={handleChange} placeholder="Your Username" required />
            {errors.username && <small className="text-danger">{errors.username}</small>}
          </div>

          <div className="mb-3">
            <label className="form-label">Password:</label>
            <input type="password" name="password" className="form-control" value={formData.password} onChange={handleChange} placeholder="At least 8 characters" required />
            {errors.password && <small className="text-danger">{errors.password}</small>}
          </div>

          <div className="mb-3">
            <label className="form-label">Confirm Password:</label>
            <input type="password" name="confirmPassword" className="form-control" value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter your password" required />
            {errors.confirmPassword && <small className="text-danger">{errors.confirmPassword}</small>}
          </div>

          <button className="btn btn-warning w-100" disabled={loading}>
            {loading ? "Signing Up..." : "SIGN UP"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignUp;