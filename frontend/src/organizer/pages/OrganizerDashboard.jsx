import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../shared/services/authService';
import Swal from 'sweetalert2';
import '../styles/OrganizerDashboard.css';
import SideNav from '../components/SideNav.jsx';
import NotificationDropdown from '../components/NotificationDropdown.jsx';
import UserAvatar from '../../shared/components/UserAvatar.jsx';
import Home from './Home.jsx';
import Events from './Events.jsx';
import MyTickets from './MyTickets.jsx';
import Reports from './Reports.jsx';
import Profile from './Profile.jsx';
import ForceChangePasswordModal from '../../shared/components/ForceChangePasswordModal';

const OrganizerDashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [activeSection, setActiveSection] = useState('home');
  const [selectedEventForEdit, setSelectedEventForEdit] = useState(null);
  const [hasTicket, setHasTicket] = useState(false);
  const [showForceChange, setShowForceChange] = useState(false);

  useEffect(() => {
    const role = authService.getRole();
    const token = authService.getToken();
    
    if (!token || role !== 'organizer') {
      navigate('/login');
      return;
    }

    const storedName = localStorage.getItem('firstName') || sessionStorage.getItem('firstName') || 'Organizer';
    setUserName(storedName);
  if (sessionStorage.getItem('requiresPasswordChange')) setShowForceChange(true);
    // Check if organizer has any tickets stored locally
    const loadTickets = () => {
      try {
        const raw = localStorage.getItem('myTickets');
        const tickets = raw ? JSON.parse(raw) : [];
        setHasTicket(Array.isArray(tickets) && tickets.length > 0);
      } catch {
        setHasTicket(false);
      }
    };

    loadTickets();
    const onStorage = (e) => {
      if (e.key === 'myTickets') loadTickets();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
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

    // Use authService to ensure any backend/session cleanup is handled
    authService.logout();
    navigate('/login');
  };

  const handleViewActiveEvent = (event) => {
    try {
      localStorage.setItem('activeEventId', String(event.id));
      localStorage.setItem('activeEvent', JSON.stringify(event));
    } catch {
      /* ignore storage errors */
    }
    setActiveSection('mytickets');
  };

  const renderContent = () => {
    switch(activeSection) {
      case 'home':
        return <Home onRedirectToEdit={(event) => { setSelectedEventForEdit(event); setActiveSection('events'); }} onViewActiveEvent={handleViewActiveEvent} />;
      case 'events':
        return <Events initialEventToEdit={selectedEventForEdit} onClearEditEvent={() => setSelectedEventForEdit(null)} onViewActiveEvent={handleViewActiveEvent} />;
      case 'mytickets':
        return <MyTickets />;
      case 'profile':
        return <Profile />;
      case 'reports':
        return <Reports />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="organizer-dashboard">
      <div className="dashboard-header">
        <h1>Event Management System</h1>
        <div className="header-right">
          <span className="user-greeting">Welcome, {userName}!</span>
          <UserAvatar userName={userName} />
          <NotificationDropdown />
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
export default OrganizerDashboard;
