// src/pages/Dashboard.jsx
import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate("/signin");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-orange-600">My App</h1>
          <button
            onClick={handleSignOut}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <div className="container mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-6">
          Welcome to your Dashboard
        </h2>

        {currentUser && (
          <div className="mb-6">
            <p className="text-gray-700">
              <span className="font-medium">Name:</span>{" "}
              {currentUser.first_name} {currentUser.last_name}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Email:</span> {currentUser.email}
            </p>
          </div>
        )}

        <div className="border-t pt-4">
          <p className="text-gray-600">
            You are successfully authenticated with our backend API!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
