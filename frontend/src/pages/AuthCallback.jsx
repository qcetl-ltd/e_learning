// In AuthCallback.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchCurrentUser } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get token from URL query parameters
        const params = new URLSearchParams(location.search);
        const token = params.get("token");
        const errorMsg = params.get("message");

        if (errorMsg) {
          console.error("Error message from callback:", errorMsg);
          setError(errorMsg);
          setTimeout(() => navigate("/signin"), 3000);
          return;
        }

        if (token) {
          console.log("Token received from callback:", token); // Debugging
          // Store the token in localStorage
          localStorage.setItem("token", token);

          // Fetch the current user with the new token
          const user = await fetchCurrentUser();
          console.log("User fetched:", user); // Debugging

          if (user) {
            // Redirect to dashboard
            navigate("/dashboard", { replace: true }); // Ensure proper redirection
          } else {
            setError("Failed to fetch user profile");
            setTimeout(() => navigate("/signin"), 3000);
          }
        } else {
          console.error("No token received from callback");
          setError("No authentication token received");
          setTimeout(() => navigate("/signin"), 3000);
        }
      } catch (error) {
        console.error("Error processing OAuth callback:", error);
        setError("Authentication failed");
        setTimeout(() => navigate("/signin"), 3000);
      }
    };

    handleCallback();
  }, [location, navigate, fetchCurrentUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-6 bg-white rounded-lg shadow-md">
        {error ? (
          <>
            <h2 className="text-2xl font-bold mb-4 text-red-600">
              Authentication Error
            </h2>
            <p className="text-gray-700 mb-4">{error}</p>
            <p className="text-sm text-gray-500">
              Redirecting to sign-in page...
            </p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4">Processing login...</h2>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
