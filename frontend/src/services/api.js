// src/services/api.js
import axios from "axios";

const API_URL = "http://localhost:8000/api/v1";

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add interceptor to include auth token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth services
export const authService = {
  signUp: (userData) => api.post("/auth/signup", userData),
  signIn: (credentials) => api.post("/auth/signin", credentials),
  getCurrentUser: () => api.get("/users/me"),
  // New method to resend verification email
  resendVerificationEmail: (email) =>
    api.post("/auth/resend-verification", { email }),
};

export default api;
