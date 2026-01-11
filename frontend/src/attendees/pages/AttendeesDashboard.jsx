import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../shared/services/authService';
import Swal from 'sweetalert2';
import '../styles/AttendeesDashboard.css';
import SideNav from '../components/SideNav.jsx';
import NotificationDropdownViewOnly from '../../shared/components/NotificationDropdownViewOnly.jsx';
import UserAvatar from '../../shared/components/UserAvatar.jsx';
import BrowseEvents from './BrowseEvents.jsx';
import MyTickets from './MyTickets.jsx';
import Profile from './Profile.jsx';
import ForceChangePasswordModal from '../../shared/components/ForceChangePasswordModal';

const AttendeesDashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [activeSection, setActiveSection] = useState('events');
  const [showForceChange, setShowForceChange] = useState(false);

  useEffect(() => {
    const role = authService.getRole();
    const token = authService.getToken();
    
    if (!token || role !== 'attendees') {
      navigate('/login');
      return;
    }

    const storedName = localStorage.getItem('firstName') || sessionStorage.getItem('firstName') || 'Attendee';
    setUserName(storedName);

  if (sessionStorage.getItem('requiresPasswordChange')) setShowForceChange(true);

    // Listen for profile navigation event
    const handleNavigateToProfile = () => {
      setActiveSection('profile');
    };
    
    window.addEventListener('navigateToProfile', handleNavigateToProfile);
    return () => window.removeEventListener('navigateToProfile', handleNavigateToProfile);
  }, [navigate]);

  const handleLogout = async () => {
    const res = await Swal.fire({
      title: 'Logout',
      text: 'Are you sure you want to logout?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Logout',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#0f766e',
      cancelButtonColor: '#6b7280'
    });

    if (!res.isConfirmed) return;

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
        <h1>Event Management System</h1>
        <div className="header-right">
          <span className="user-greeting">Welcome, {userName}!</span>
          <UserAvatar userName={userName} />
          <NotificationDropdownViewOnly />
          <div className="header-separator"></div>
          <button onClick={handleLogout} className="logout-button" title="Logout">
            <svg className="logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
              <line x1="12" y1="2" x2="12" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="dashboard-layout">
        <SideNav activeSection={activeSection} onChange={setActiveSection} />
        <main className="main-content">
          {renderContent()}
          {showForceChange && <ForceChangePasswordModal onClose={() => setShowForceChange(false)} />}
        </main>
      </div>
    </div>
  );
};

export default AttendeesDashboard;
