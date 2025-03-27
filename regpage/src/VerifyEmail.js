import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const VerifyEmail = () => {
  const [status, setStatus] = useState("Verifying...");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (token) {
      // Verify email by sending token to FastAPI
      const verifyEmail = async () => {
        try {
          const response = await fetch(`http://127.0.0.1:8000/verify-email?token=${token}`);
          const data = await response.json();
          if (response.ok) {
            setStatus("Email verified successfully! You can now log in.");
            setTimeout(() => navigate("/LoginDashboard"), 2000);  // Redirect to sign-in after 2 seconds
          } else {
            setStatus(data.detail);
          }
        } catch (error) {
          setStatus("Error verifying email. Please try again.");
        }
      };

      verifyEmail();
    }
  }, [token, navigate]);

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card p-4 shadow" style={{ width: "400px" }}>
        <h2 className="text-center">{status}</h2>
      </div>
    </div>
  );
};

export default VerifyEmail;
