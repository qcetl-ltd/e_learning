import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const SignInPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, error, currentUser } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate("/dashboard");
    }
  }, [currentUser, navigate]);

  // Validation state
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    form: "",
  });

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    return "";
  };

  // Handle input changes
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setErrors((prev) => ({ ...prev, email: validateEmail(value) }));
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setErrors((prev) => ({ ...prev, password: validatePassword(value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log("Submitting with:", { email, password });

    // Validate all fields
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    setErrors({
      email: emailError,
      password: passwordError,
      form: "",
    });

    // If no validation errors, submit the form
    if (!emailError && !passwordError) {
      setIsSubmitting(true);
      try {
        const success = await signIn(email, password);
        if (success) {
          navigate("/dashboard");
        } else {
          setErrors((prev) => ({ ...prev, form: error || "Sign in failed" }));
        }
      } catch {
        setErrors((prev) => ({
          ...prev,
          form: "An unexpected error occurred",
        }));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // SSO Authentication handlers
  const handleGoogleSignIn = () => {
    console.log("Initiating Google SSO authentication");
    // Implement Google SSO logic here
    // Redirect to the backend's Google OAuth login endpoint
    window.location.href = "http://localhost:8000/api/v1/auth/google/login";
  };

  const handleMicrosoftSignIn = () => {
    console.log("Initiating Microsoft SSO authentication");
    // Implement Microsoft SSO logic here
     window.location.href = "http://localhost:8000/api/v1/auth/microsoft/login";
  };

  const handleFacebookSignIn = () => {
    console.log("Initiating Facebook SSO authentication");
    // Implement Facebook SSO logic here
    window.location.href = "http://localhost:8000/api/v1/auth/facebook/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-300 bg-opacity-90 ">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-center mb-2">Sign In</h1>

        <div className="text-center text-gray-500 mb-6">
          Not registered yet?{" "}
          <Link to="/signup" className="text-blue-500 hover:underline">
            Sign Up
          </Link>
        </div>

        {/* Show form error if present */}
        {errors.form && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">
            {errors.form}
          </div>
        )}

        <div className="border-t border-gray-200 my-6"></div>

        <div className="space-y-4">
          {/* Google SSO Button */}
          <button
            onClick={handleGoogleSignIn}
            className="flex items-center justify-center w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition"
          >
            <svg
              className="w-6 h-6 mr-2"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
            </svg>
            Continue with Google
          </button>

          {/* Microsoft SSO Button */}
          <button
            onClick={handleMicrosoftSignIn}
            className="flex items-center justify-center w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
          >
            <svg
              className="w-6 h-6 mr-2"
              viewBox="0 0 23 23"
              fill="currentColor"
            >
              <path d="M0 0h10.931v10.931H0zM12.069 0H23v10.931H12.069zM0 12.069h10.931V23H0zM12.069 12.069H23V23H12.069z" />
            </svg>
            Continue with Microsoft
          </button>

          {/* Facebook SSO Button */}
          <button
            onClick={handleFacebookSignIn}
            className="flex items-center justify-center w-full bg-blue-800 text-white py-2 px-4 rounded-md hover:bg-blue-900 transition"
          >
            <svg
              className="w-6 h-6 mr-2"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M20.007 3H3.993C3.445 3 3 3.445 3 3.993v16.014c0 .548.445.993.993.993h8.621v-6.971h-2.346v-2.717h2.346V9.31c0-2.325 1.42-3.591 3.494-3.591.993 0 1.847.074 2.096.107v2.43h-1.438c-1.128 0-1.346.537-1.346 1.324v1.734h2.69l-.35 2.717h-2.34V21h4.587c.548 0 .993-.445.993-.993V3.993c0-.548-.445-.993-.993-.993z" />
            </svg>
            Continue with Facebook
          </button>
        </div>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="px-4 text-gray-500">or</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-gray-700 mb-2 text-left "
            >
              Email Id:
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailChange}
              className="w-full px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
              placeholder="jane.doe@gmail.com"
              required
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-gray-700 mb-2 text-left"
            >
              Password:
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={handlePasswordChange}
              onBlur={handlePasswordChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Type here"
              required
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full ${
              isSubmitting
                ? "bg-orange-300"
                : "bg-orange-400 hover:bg-orange-500"
            } text-white py-3 px-4 rounded-md transition font-bold`}
          >
            {isSubmitting ? "SIGNING IN..." : "SIGN IN"}
          </button>

          <div className="text-center mt-4">
            <a href="#" className="text-gray-500 hover:underline">
              Forgot password?
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignInPage;
