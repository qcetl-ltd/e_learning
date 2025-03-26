import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const LoginDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get user details from local storage or API
    const storedUser = JSON.parse(localStorage.getItem("user"));

    if (!storedUser) {
      navigate("/signin"); // Redirect if not logged in
    } else {
      setUser(storedUser);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user"); // Clear stored user data
    navigate("/signin"); // Redirect to sign-in page
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card p-4 shadow" style={{ width: "400px" }}>
        <h2 className="text-center">Welcome to Dashboard</h2>
        {user ? (
          <>
            <p className="text-center text-muted">Logged in as: <b>{user.email}</b></p>
            <button className="btn btn-danger w-100" onClick={handleLogout}>
              LOG OUT
            </button>
          </>
        ) : (
          <p className="text-center text-muted">Loading user data...</p>
        )}
      </div>
    </div>
  );
};

export default LoginDashboard;
