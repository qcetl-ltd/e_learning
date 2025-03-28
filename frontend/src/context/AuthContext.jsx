// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import { authService } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      console.log("Token being sent:", token); // Debugging: Log the token
      const response = await authService.getCurrentUser();
      setCurrentUser(response.data);
      return response.data;
    } catch (err) {
      console.error("Failed to fetch user:", err);
      // If unauthorized (token expired or invalid), clear the token
      if (err.response && err.response.status === 401) {
        localStorage.removeItem("token");
        setCurrentUser(null);
      }
      setError("Failed to authenticate user");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.signIn({ email, password });
      localStorage.setItem("token", response.data.access_token);
      await fetchCurrentUser();
      return true;
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      await authService.signUp(userData);
      return true;
    } catch (err) {
      setError(err.response?.data?.detail || "Sign up failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem("token");
    setCurrentUser(null);
  };

  const resendVerificationEmail = async (email) => {
    setLoading(true);
    setError(null);
    try {
      await authService.resendVerificationEmail(email);
      return {
        success: true,
        message: "Verification email resent successfully!",
      };
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to resend verification email"
      );
      return {
        success: false,
        message:
          err.response?.data?.detail || "Failed to resend verification email",
      };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    fetchCurrentUser,
    resendVerificationEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
