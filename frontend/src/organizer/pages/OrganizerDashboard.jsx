import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/OrganizerDashboard.css';
import SideNav from '../components/SideNav.jsx';
import Home from './Home.jsx';
import Events from './Events.jsx';
import MyTickets from './MyTickets.jsx';
import Reports from './Reports.jsx';

const OrganizerDashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [activeSection, setActiveSection] = useState('home');
  const [selectedEventForEdit, setSelectedEventForEdit] = useState(null);
  const [hasTicket, setHasTicket] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const token = localStorage.getItem('token');
    
    if (!token || role !== 'organizer') {
      navigate('/login');
      return;
    }

    const storedName = localStorage.getItem('firstName') || 'Organizer';
    setUserName(storedName);
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

  const handleLogout = () => {
    localStorage.clear();
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
      case 'reports':
        return <Reports />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="organizer-dashboard">
      <div className="dashboard-header">
        <h1>Organizer Dashboard</h1>
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
export default OrganizerDashboard;
