import React, { useEffect, useState } from 'react';
import { MdEvent, MdPeople, MdStars } from 'react-icons/md';
import Swal from 'sweetalert2';
import Pagination from '../../components/Pagination';

const Home = ({ onRedirectToEdit }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState('card');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeAttendees, setActiveAttendees] = useState(0);
  const [activeOrganizers, setActiveOrganizers] = useState(0);
  const [activeAttendeeList, setActiveAttendeeList] = useState([]);
  const [activeOrganizerList, setActiveOrganizerList] = useState([]);

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${base}/events`);
        if (!res.ok) {
          throw new Error(`Failed to load events (${res.status})`);
        }
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        console.error('Load events failed', err);
        setError(err.message || 'Failed to load events');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchStats = async () => {
      try {
        const res = await fetch(`${base}/manage-account/stats`);
        if (!res.ok) return;
        const stats = await res.json();
        setActiveAttendees(Number(stats.activeAttendees || 0));
        setActiveOrganizers(Number(stats.activeOrganizers || 0));
      } catch (e) {
        // ignore stats errors
      }
    };

    const fetchActiveLists = async () => {
      try {
        const [attRes, orgRes] = await Promise.all([
          fetch(`${base}/manage-account/attendees/active`),
          fetch(`${base}/manage-account/organizers/active`)
        ]);
        if (attRes.ok) {
          const attendees = await attRes.json();
          setActiveAttendeeList(Array.isArray(attendees) ? attendees : []);
        }
        if (orgRes.ok) {
          const organizers = await orgRes.json();
          setActiveOrganizerList(Array.isArray(organizers) ? organizers : []);
        }
      } catch {}
    };

    fetchEvents();
    fetchStats();
    fetchActiveLists();
  }, []);

  const filteredEvents = events.filter(event => {
    const isActiveEvent = event.status === 'upcoming' || event.status === 'ongoing';
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'active' ? isActiveEvent :
      (filterStatus === 'all' ? true : event.status === filterStatus);
    return matchesSearch && matchesFilter && isActiveEvent;
  });

  const itemsPerPage = viewMode === 'card' ? 5 : 10;
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentEvents = filteredEvents.slice(startIndex, startIndex + itemsPerPage);

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (value) => {
    setFilterStatus(value);
    setCurrentPage(1);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setCurrentPage(1);
  };

  return (
    <div className="section">
      <h2>Home / Events List</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <MdEvent className="stat-icon" />
          <div className="stat-info">
            <h3>Total Events</h3>
            <p className="stat-value">{filteredEvents.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <MdPeople className="stat-icon" />
          <div className="stat-info">
            <h3>Active Attendees</h3>
            <p className="stat-value">{activeAttendees}</p>
          </div>
        </div>
        <div className="stat-card">
          <MdStars className="stat-icon" />
          <div className="stat-info">
            <h3>Active Organizers</h3>
            <p className="stat-value">{activeOrganizers}</p>
          </div>
        </div>
      </div>

      <div className="events-section">
        <h3>Upcoming & Ongoing Events</h3>
        {error && (
          <div style={{ padding: '10px', marginBottom: '12px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#991b1b' }}>
            {error}
          </div>
        )}
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search events by name or location..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          <select value={filterStatus} onChange={(e) => handleFilterChange(e.target.value)}>
            <option value="active">Upcoming & Ongoing</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
          </select>
          <select value={viewMode} onChange={(e) => handleViewModeChange(e.target.value)} className="view-mode-select">
            <option value="card">⊞ Cards</option>
            <option value="table">≡ Table</option>
          </select>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '24px', color: '#555' }}>Loading events...</div>
        )}

        {viewMode === 'card' ? (
        <>
        <div className="events-grid">
          {currentEvents.length > 0 ? (
            currentEvents.map(event => (
              <div key={event.id} className="event-card">
                <div className="event-header">
                  <h4>{event.title}</h4>
                  <span className={`status-badge ${event.status}`}>{event.status}</span>
                </div>
                <div className="event-details">
                  <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p><strong>Time:</strong> {event.time}</p>
                  <p><strong>Location:</strong> {event.location}</p>
                  <p><strong>Capacity:</strong> {event.registered} / {event.capacity}</p>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${(event.registered / event.capacity) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="event-actions">
                  <button className="btn-secondary" onClick={() => setSelectedEvent(event)}>View Details</button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>No events found matching your criteria</p>
            </div>
          )}
        </div>
        {filteredEvents.length > itemsPerPage && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
        </>
        ) : (
        <>
        <div className="events-table-container">
          <table className="events-table">
            <thead>
              <tr>
                <th>Event Title</th>
                <th>Date</th>
                <th>Time</th>
                <th>Location</th>
                <th>Capacity</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentEvents.length > 0 ? (
                currentEvents.map(event => (
                  <tr key={event.id}>
                    <td>{event.title}</td>
                    <td>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td>{event.time}</td>
                    <td>{event.location}</td>
                    <td>{event.registered} / {event.capacity}</td>
                    <td><span className={`status-badge ${event.status}`}>{event.status}</span></td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn-secondary" onClick={() => setSelectedEvent(event)} style={{ padding: '6px 12px', fontSize: '13px' }}>View</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>No events found matching your criteria</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filteredEvents.length > itemsPerPage && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
        </>
        )}
        {selectedEvent && (
          <EventDetailsModal
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onRedirectToEdit={onRedirectToEdit}
          />
        )}
      </div>
    </div>
  );
};

const EventDetailsModal = ({ event, onClose, onRedirectToEdit }) => {
  const userName = localStorage.getItem('firstName') || 'Admin';
  const [isRegistered, setIsRegistered] = useState(() => {
    try {
      const raw = localStorage.getItem('myTickets');
      const tickets = raw ? JSON.parse(raw) : [];
      return tickets.some(t => t.eventId === event.id && t.userName === userName);
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const seedFromLocal = () => {
      try {
        const raw = localStorage.getItem('myTickets');
        const tickets = raw ? JSON.parse(raw) : [];
        return tickets.some(t => t.eventId === event.id && t.userName === userName);
      } catch {
        return false;
      }
    };

    let isActive = true;
    setIsRegistered(seedFromLocal());

    const verifyRegistration = async () => {
      try {
        const adminId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
        if (!adminId) return;

        const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${base}/events/admin/${adminId}/registrations`, { headers });
        if (!response.ok) {
          throw new Error('Failed to verify registration status');
        }

        const registrations = await response.json();
        const alreadyRegistered = Array.isArray(registrations)
          ? registrations.some((registration) => {
              const regEventId = registration.eventId ?? registration.event?.id;
              return Number(regEventId) === Number(event.id);
            })
          : false;

        if (isActive) {
          setIsRegistered(alreadyRegistered);
        }
      } catch (error) {
        console.error('Failed to check registration status', error);
      }
    };

    verifyRegistration();
    return () => {
      isActive = false;
    };
  }, [event.id, userName]);

  const handleEdit = () => {
    onRedirectToEdit(event);
    onClose();
  };

  const handleRegister = async () => {
    const ticketCode = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const qrData = JSON.stringify({ ticketCode, eventId: event.id, eventTitle: event.title, userName });
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;

    try {
      // Get admin ID from localStorage/sessionStorage
      const adminId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      if (!adminId) {
        throw new Error('User not authenticated');
      }

      // Register via backend API
      const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch(`${base}/events/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          eventId: event.id,
          adminId: parseInt(adminId),
          attendeeName: userName,
          ticketCode: ticketCode
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to register for event');
      }

      const registration = await response.json();

      // Also save to localStorage for quick access
      const ticket = {
        id: registration.id,
        ticketId: ticketCode,
        ticketCode: ticketCode,
        eventId: event.id,
        eventTitle: event.title,
        date: event.date,
        time: event.time,
        location: event.location,
        status: event.status,
        registeredAt: registration.registeredAt || new Date().toISOString(),
        userName,
        qrCode: qrUrl
      };

      const raw = localStorage.getItem('myTickets');
      const tickets = raw ? JSON.parse(raw) : [];
      tickets.push(ticket);
      localStorage.setItem('myTickets', JSON.stringify(tickets));

      Swal.fire({
        icon: 'success',
        title: 'Registration Successful!',
        html: `<div style="text-align: left;">
          <div style="background: #f0f9f8; padding: 10px; margin: 8px 0; border-left: 3px solid #0f766e; border-radius: 4px;">
            <strong style="color: #0f766e;">Ticket ID:</strong> ${ticketCode}
          </div>
          <div style="margin: 8px 0;"><strong style="color: #333;">Event:</strong> ${event.title}</div>
          <div style="margin: 8px 0;"><strong style="color: #333;">Attendee:</strong> ${userName}</div>
        </div>`,
        confirmButtonColor: '#0f766e',
        confirmButtonText: 'OK'
      });
      setIsRegistered(true);
      onClose();
    } catch (err) {
      console.error('Registration error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: err.message || 'Please try again.',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header modal-header-row">
          <h2>{event.title}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div style={{ padding: '20px 30px 30px 30px' }}>
          {event.description && (
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f9f8', borderLeft: '4px solid #0f766e', borderRadius: '4px' }}>
              <p style={{ margin: '0', color: '#333', lineHeight: '1.6' }}>{event.description}</p>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</p>
              <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#333' }}><span className={`status-badge ${event.status}`}>{event.status}</span></p>
            </div>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Capacity</p>
              <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#333' }}>{event.registered} / {event.capacity}</p>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Capacity Progress</p>
              <div className="progress-bar" style={{ marginTop: '8px' }}>
                <div
                  className="progress-fill"
                  style={{ width: `${(event.registered / event.capacity) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Organizer</p>
              <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#333' }}>{`${event.createdByFirstName || ''} ${event.createdByLastName || ''}`.trim() || event.organizerName || event.createdByName || '—'}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</p>
              <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#0f766e' }}>{event.createdByEmail || event.organizerEmail || '—'}</p>
            </div>
            {event.staff && event.staff.length > 0 && (
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Staff</p>
                <div style={{ margin: '0', fontSize: '15px', color: '#333' }}>
                  {event.staff.map((staffMember, idx) => (
                    <p key={idx} style={{ margin: '4px 0', paddingLeft: '8px', borderLeft: '2px solid #d1fae5' }}>{staffMember}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
          <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</p>
              <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#333' }}>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time</p>
              <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#333' }}>{event.time}</p>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location</p>
              <p style={{ margin: '0', fontSize: '15px', color: '#333' }}>{event.location}</p>
            </div>
          </div>
          <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={onClose}>Close</button>
            <button className="btn-secondary" onClick={handleEdit}>Edit</button>
            <button
              className="btn-primary"
              style={{ background: isRegistered ? '#9ca3af' : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', cursor: isRegistered ? 'not-allowed' : 'pointer' }}
              onClick={handleRegister}
              disabled={isRegistered}
            >
              {isRegistered ? '✓ Already Registered' : 'Register'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
