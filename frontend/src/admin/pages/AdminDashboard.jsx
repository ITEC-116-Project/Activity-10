import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../shared/services/authService';
import Swal from 'sweetalert2';
import '../styles/AdminDashboard.css';
import SideNav from '../components/SideNav.jsx';
import Home from './Home.jsx';
import Events from './Events.jsx';
import MyTickets from './MyTickets.jsx';
import Users from './Users.jsx';
import Organizers from './Organizers.jsx';
import Reports from './Reports.jsx';
import Profile from './Profile.jsx';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [activeSection, setActiveSection] = useState('home');
  const [selectedEventForEdit, setSelectedEventForEdit] = useState(null);
  const [hasTicket, setHasTicket] = useState(false);

  useEffect(() => {
    const role = authService.getRole();
    const token = authService.getToken();
    
    if (!token || role !== 'admin') {
      navigate('/login');
      return;
    }

    const storedName = localStorage.getItem('firstName') || sessionStorage.getItem('firstName') || 'Admin';
    setUserName(storedName);
    // Check if admin has any tickets stored locally
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

    authService.logout();
    navigate('/login');
  };

  const renderContent = () => {
    switch(activeSection) {
      case 'home':
        return <Home onRedirectToEdit={(event) => { setSelectedEventForEdit(event); setActiveSection('events'); }} />;
      case 'events':
        return <Events initialEventToEdit={selectedEventForEdit} onClearEditEvent={() => setSelectedEventForEdit(null)} />;
      case 'mytickets':
        return <MyTickets />;
      case 'profile':
        return <Profile />;
      case 'users':
        return <Users />;
      case 'organizers':
        return <Organizers />;
      case 'reports':
        return <Reports />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Event Management System</h1>
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
export default AdminDashboard;
