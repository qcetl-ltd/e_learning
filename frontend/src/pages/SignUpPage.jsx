import React, { useState, useEffect } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
const SignUpPage = () => {
  const navigate = useNavigate();
  const { signUp, error, currentUser } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate("/dashboard");
    }
  }, [currentUser, navigate]);
  // State for form data
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  // State for UI control
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Simulate progress during form submission
  const simulateProgress = () => {
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 5;
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        clearInterval(interval);
      }
    }, 150);

    return interval;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!formData.firstName || !formData.lastName) {
      setMessage({
        type: "error",
        text: "First name and last name are required",
      });
      return;
    }

    if (!formData.email) {
      setMessage({ type: "error", text: "Email is required" });
      return;
    }

    if (!formData.password) {
      setMessage({ type: "error", text: "Password is required" });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }

    if (!formData.agreeTerms) {
      setMessage({
        type: "error",
        text: "You must agree to the privacy policy",
      });
      return;
    }

    // Start loading state
    setLoading(true);
    setMessage({ type: "", text: "" });
    const progressInterval = simulateProgress();

    try {
      // Prepare user data for API call
      const userData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirmPassword,
      };

      // Call signup method from auth context
      const success = await signUp(userData);

      // Clear progress interval
      clearInterval(progressInterval);
      setProgress(100);

      if (success) {
        // Handle successful response
        setMessage({
          type: "success",
          text: `Registration Successful! Please confirm your account by clicking the link sent to ${formData.email}`,
        });

        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          confirmPassword: "",
          agreeTerms: false,
        });

        // Redirect to sign in after successful registration
        setTimeout(() => {
          navigate("/signin");
        }, 2000);
      } else {
        // Handle error
        setMessage({
          type: "error",
          text: error || "Registration failed. Please try again.",
        });
        setProgress(0);
      }
    } catch (error) {
      console.error("Registration error:", error);
      // Clear progress interval
      clearInterval(progressInterval);
      setProgress(0);

      // Handle error
      setMessage({
        type: "error",
        text: "Registration failed. Please try again.",
      });
    } finally {
      // End loading state after a slight delay
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-300 bg-opacity-90 ">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-center mb-2">Sign Up</h1>

        {/* Progress bar */}
        {loading && (
          <div className="w-full h-2 bg-gray-200 rounded-full mb-6 overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}

        {/* Message display */}
        {message.text && (
          <div
            className={`p-4 mb-6 rounded-md text-center ${
              message.type === "success"
                ? "bg-green-100 text-green-800 border border-green-500"
                : "bg-red-100 text-red-800 border border-red-500"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label
                htmlFor="firstName"
                className="block text-gray-500 text-left mb-2"
              >
                First Name:
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Enter your first name"
                disabled={loading}
                className="w-full px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>

            <div className="flex-1">
              <label
                htmlFor="lastName"
                className="block text-gray-500 text-left mb-2"
              >
                Last Name:
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Enter your last name"
                disabled={loading}
                className="w-full px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
          </div>

          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-gray-500 text-left mb-2"
            >
              Email:
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email address"
              disabled={loading}
              className="w-full px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-gray-500 text-left mb-2"
            >
              Password:
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                disabled={loading}
                className="w-full px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-400 hover:text-orange-500 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOffIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label
              htmlFor="confirmPassword"
              className="block text-gray-500 text-left mb-2"
            >
              Confirm Password:
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                disabled={loading}
                className="w-full px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-400 hover:text-orange-500 focus:outline-none"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                {showConfirmPassword ? (
                  <EyeOffIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center mb-6">
            <input
              type="checkbox"
              id="agreeTerms"
              name="agreeTerms"
              checked={formData.agreeTerms}
              onChange={handleChange}
              disabled={loading}
              className="w-4 h-4 bg-white border-orange-300 rounded focus:ring-orange-500"
            />
            <label htmlFor="agreeTerms" className="ml-2 text-gray-500">
              I Agree with{" "}
              <a
                href="/privacy"
                className="text-blue-500 hover:text-blue-400 hover:underline"
              >
                privacy
              </a>{" "}
              and{" "}
              <a
                href="/policy"
                className="text-blue-500 hover:text-blue-400 hover:underline"
              >
                policy
              </a>
            </label>
          </div>

          <button
            type="submit"
            className={`w-full p-3 rounded-md font-bold text-white transition-colors duration-300 ${
              loading
                ? "bg-orange-800 cursor-not-allowed"
                : "bg-orange-600 hover:bg-orange-700"
            }`}
            disabled={loading}
          >
            {loading ? "Signing up..." : "Sign up"}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-500">
          Already have an account?{" "}
          <a href="/signin" className="text-blue-500 hover:underline">
            Sign In
          </a>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
