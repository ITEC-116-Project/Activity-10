import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/OrganizerDashboard.css';

const OrganizerDashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const token = localStorage.getItem('token');
    
    if (!token || role !== 'organizer') {
      navigate('/login');
      return;
    }

    const storedName = localStorage.getItem('firstName') || 'Organizer';
    setUserName(storedName);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="organizer-dashboard">
      <div className="dashboard-header">
        <h1>Organizer Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </div>
      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>Welcome, {userName}!</h2>
          <p>You are logged in as an Event Organizer</p>
        </div>
        <div className="dashboard-cards">
          <div className="dashboard-card">
            <h3>My Events</h3>
            <p>View and manage your events</p>
          </div>
          <div className="dashboard-card">
            <h3>Create Event</h3>
            <p>Create a new event</p>
          </div>
          <div className="dashboard-card">
            <h3>Attendees</h3>
            <p>View event attendees</p>
          </div>
          <div className="dashboard-card">
            <h3>Analytics</h3>
            <p>View event analytics</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerDashboard;
