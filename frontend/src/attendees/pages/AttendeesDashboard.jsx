import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../shared/services/authService';
import '../styles/AttendeesDashboard.css';
import SideNav from '../components/SideNav.jsx';
import BrowseEvents from './BrowseEvents.jsx';
import MyTickets from './MyTickets.jsx';
import Profile from './Profile.jsx';

const AttendeesDashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [activeSection, setActiveSection] = useState('events');

  useEffect(() => {
    const role = authService.getRole();
    const token = authService.getToken();
    
    if (!token || role !== 'attendees') {
      navigate('/login');
      return;
    }

    const storedName = localStorage.getItem('firstName') || sessionStorage.getItem('firstName') || 'Attendee';
    setUserName(storedName);

    // Listen for profile navigation event
    const handleNavigateToProfile = () => {
      setActiveSection('profile');
    };
    
    window.addEventListener('navigateToProfile', handleNavigateToProfile);
    return () => window.removeEventListener('navigateToProfile', handleNavigateToProfile);
  }, [navigate]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const renderContent = () => {
    switch(activeSection) {
      case 'events':
        return <BrowseEvents />;
      case 'mytickets':
        return <MyTickets />;
      case 'profile':
        return <Profile />;
      default:
        return <BrowseEvents />;
    }
  };

  return (
    <div className="attendees-dashboard">
      <div className="dashboard-header">
        <h1>Attendees Dashboard</h1>
        <div className="header-right">
          <span className="user-greeting">Welcome, {userName}!</span>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      </div>
      
      <div className="dashboard-layout">
        <SideNav activeSection={activeSection} onChange={setActiveSection} />
        <main className="main-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AttendeesDashboard;
