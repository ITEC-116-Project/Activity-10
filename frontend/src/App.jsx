// src/App.jsx
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MainPage from "./pages/mainPage";
import LoginPage from "./loginSignup/pages/LoginPage";
import SignupPage from "./loginSignup/pages/SignupPage";
import AdminDashboard from "./admin/pages/AdminDashboard";
import OrganizerDashboard from "./organizer/pages/OrganizerDashboard";
import AttendeesDashboard from "./attendees/pages/AttendeesDashboard";
import ProtectedRoute from "./shared/components/ProtectedRoute";
import { authService } from "./shared/services/authService";
import "./App.css";

function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Validate token on app load (page refresh)
    const validateTokenOnLoad = async () => {
      const token = localStorage.getItem("token");
      
      if (token) {
        try {
          await authService.validateToken();
          setIsAuthenticated(true);
        } catch (error) {
          // Token is invalid, clear localStorage
          localStorage.clear();
          setIsAuthenticated(false);
        }
      }
      
      setIsInitializing(false);
    };

    validateTokenOnLoad();
  }, []);

  // Show nothing while initializing to prevent flash of login page
  if (isInitializing) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected Routes */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/organizer/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['organizer']}>
              <OrganizerDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/attendees/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['attendees']}>
              <AttendeesDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
