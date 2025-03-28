import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import SignInPage from "./pages/SignInPage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AuthCallback from "./pages/AuthCallback.jsx";
import EmailVerificationPage from "./pages/EmailVerificationPage.jsx";

// Protected route component
const ProtectedRoute = () => {
  const { currentUser, loading } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return currentUser ? <Outlet /> : <Navigate to="/signin" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />{" "}
          {/* Add this new route */}
          <Route
            path="/auth/error"
            element={<Navigate to="/signin" replace />}
          />
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            {/* Add more protected routes here */}
          </Route>
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/signin" replace />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
