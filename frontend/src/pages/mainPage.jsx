import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../style/mainPage.css";

function MainPage() {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem("token");

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (isAuthenticated) {
      const userRole = localStorage.getItem("userRole");
      const delayRedirect = setTimeout(() => {
        switch (userRole) {
          case "admin":
            navigate("/admin/dashboard");
            break;
          case "organizer":
            navigate("/organizer/dashboard");
            break;
          case "attendees":
            navigate("/attendees/dashboard");
            break;
          default:
            navigate("/login");
        }
      }, 300); // Small delay to allow smooth transition
      
      return () => clearTimeout(delayRedirect);
    }
  }, [isAuthenticated, navigate]);

  const handleGetStarted = () => {
    navigate("/login");
  };

  return (
    <div className="main-container">
      <div className="landing-content">
        <h1 className="main-title">Welcome to Event Management System</h1>
        <p className="main-description">
          Join us and manage your events efficiently. Whether you're an admin, organizer, or attendee, we have the perfect platform for you.
        </p>
        <div className="button-group">
          <button className="main-button primary" onClick={handleGetStarted}>
            Get Started - Login
          </button>
          <button 
            className="main-button secondary" 
            onClick={() => navigate("/signup")}
          >
            Create Account
          </button>
        </div>
        <div className="features">
          <div className="feature-item">
            <h3>For Admins</h3>
            <p>Manage all users and system settings</p>
          </div>
          <div className="feature-item">
            <h3>For Organizers</h3>
            <p>Create and manage events easily</p>
          </div>
          <div className="feature-item">
            <h3>For Attendees</h3>
            <p>Discover and register for events</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainPage;
