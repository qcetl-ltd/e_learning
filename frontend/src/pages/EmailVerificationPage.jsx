// src/pages/EmailVerificationPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const EmailVerificationPage = () => {
  const [verificationStatus, setVerificationStatus] = useState({
    loading: true,
    success: false,
    message: "",
  });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Extract token from URL query parameters
        const searchParams = new URLSearchParams(location.search);
        const token = searchParams.get("token");

        if (!token) {
          throw new Error("No verification token found");
        }

        // Make API call to verify email
        const response = await axios.get(
          `http://localhost:8000/api/v1/auth/verify-email?token=${token}`
        );

        setVerificationStatus({
          loading: false,
          success: true,
          message: response.data.message || "Email verified successfully!",
        });
      } catch (error) {
        setVerificationStatus({
          loading: false,
          success: false,
          message:
            error.response?.data?.detail ||
            "Email verification failed. Please try again.",
        });
      }
    };

    verifyEmail();
  }, [location, navigate]);

  const handleOkClick = () => {
    navigate("/signin");
  };

  if (verificationStatus.loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="sr-only">Verifying Email...</span>
          </div>
          <p>Verifying Email...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-300 bg-opacity-90">
      <div className="flex justify-center items-center h-screen">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
          {verificationStatus.success ? (
            <>
              <div className="mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 mx-auto text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-4 text-green-600">
                Email Verified
              </h2>
              <p className="text-gray-600 mb-6">{verificationStatus.message}</p>
              <button
                onClick={handleOkClick}
                className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition duration-300"
              >
                OK, Go to Sign In
              </button>
            </>
          ) : (
            <>
              <div className="mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 mx-auto text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-4 text-red-600">
                Verification Failed
              </h2>
              <p className="text-gray-600 mb-6">{verificationStatus.message}</p>
              <button
                onClick={() => navigate("/signin")}
                className="bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600 transition duration-300"
              >
                Go to Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
