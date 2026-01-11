import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { MdInfoOutline, MdHowToReg } from 'react-icons/md';
import Pagination from '../../components/Pagination';

const BrowseEvents = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [startRegister, setStartRegister] = useState(false);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'

  const events = [
    {
      id: 1,
      title: 'Tech Conference 2026',
      date: '2026-02-15',
      time: '09:00 - 17:00',
      location: 'Manila Convention Center',
      capacity: 500,
      registered: 234,
      status: 'upcoming',
      description: 'A full-day technology conference covering AI, cloud, and modern web development.',
      organizerName: 'Tech Innovators Inc.',
      organizerEmail: 'events@techinnovators.com',
      staff: ['John Smith - Lead Organizer', 'Maria Garcia - Logistics Manager', 'David Chen - Technical Lead']
    },
    {
      id: 2,
      title: 'Web Development Workshop',
      date: '2026-01-20',
      time: '14:00 - 18:00',
      location: 'BGC Innovation Hub',
      capacity: 100,
      registered: 87,
      status: 'ongoing',
      description: 'Hands-on workshop focusing on React, TypeScript, and Vite best practices.',
      organizerName: 'Dev Academy Asia',
      organizerEmail: 'workshops@devacademy.ph',
      staff: ['Sarah Johnson - Workshop Instructor', 'Alex Rodriguez - Technical Support']
    },
    {
      id: 3,
      title: 'Business Seminar',
      date: '2026-03-10',
      time: '10:00 - 16:00',
      location: 'Makati Business Center',
      capacity: 200,
      registered: 145,
      status: 'upcoming',
      description: 'Executive seminar on scaling operations, finance strategies, and leadership.',
      organizerName: 'Business Excellence Corp',
      organizerEmail: 'seminars@bizexcellence.com',
      staff: ['Robert Thompson - Chief Facilitator', 'Linda Wong - Program Coordinator', 'Michael Santos - Finance Expert']
    }
  ];

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
      <h2>Events</h2>

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
                  {/* <button
                    className="btn-primary"
                    onClick={() => { setSelectedEvent(event); setStartRegister(true); }}
                  >
                    Register
                  </button> */}
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
                    <td>
                      <div className="capacity-info">
                        <span>{event.registered} / {event.capacity}</span>
                        <div className="progress-bar" style={{ height: '4px', marginTop: '4px' }}>
                          <div
                            className="progress-fill"
                            style={{ width: `${(event.registered / event.capacity) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`status-badge ${event.status}`}>{event.status}</span></td>
                    <td>
                      <div className="action-icon-buttons">
                        <button
                          className="icon-btn neutral"
                          onClick={() => { setSelectedEvent(event); setStartRegister(false); }}
                          aria-label="View details"
                        >
                          <MdInfoOutline />
                        </button>
                        <button
                          className="icon-btn primary"
                          onClick={() => { setSelectedEvent(event); setStartRegister(true); }}
                          aria-label="Register"
                        >
                          <MdHowToReg />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="empty-state" style={{ textAlign: 'center', padding: '40px' }}>No events found</td>
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
          startRegister={startRegister}
          onClose={() => { setSelectedEvent(null); setStartRegister(false); }}
        />
      )}
    </div>
  );
};

const EventDetailsModal = ({ event, onClose, startRegister = false }) => {
  const userName = localStorage.getItem('firstName') || sessionStorage.getItem('firstName') || '';
  const userEmail = localStorage.getItem('email') || '';
  const userCompany = localStorage.getItem('company') || '';
  
  const [isRegistered, setIsRegistered] = useState(() => {
    try {
      const raw = localStorage.getItem('myTickets');
      const tickets = raw ? JSON.parse(raw) : [];
      return tickets.some(t => t.eventId === event.id && t.userName === userName);
    } catch {
      return false;
    }
  });

  const [showRegistrationForm, setShowRegistrationForm] = useState(startRegister && !isRegistered);
  useEffect(() => {
    if (startRegister && !isRegistered) {
      setShowRegistrationForm(true);
    }
  }, [startRegister, isRegistered]);
  const [formData, setFormData] = useState({
    name: userName,
    email: userEmail,
    company: userCompany
  });

  const handleRegisterClick = () => {
    // Check if profile is complete (only name and email are required)
    if (!userName || !userEmail) {
      Swal.fire({
        icon: 'warning',
        title: 'Incomplete Profile',
        text: 'Please complete your profile (Name and Email) before registering for events.',
        confirmButtonText: 'Go to Profile',
        confirmButtonColor: '#0f766e',
        showCancelButton: true,
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          onClose();
          // Trigger navigation to profile section
          window.dispatchEvent(new CustomEvent('navigateToProfile'));
        }
      });
      return;
    }
    // If profile is complete, register directly without showing form
    handleRegister({ preventDefault: () => {} });
  };

  const handleRegister = (e) => {
    e.preventDefault();
    
    const ticketId = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const qrData = JSON.stringify({ ticketId, eventId: event.id, eventTitle: event.title, userName: formData.name, email: formData.email });
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;

    const ticket = {
      id: ticketId,
      ticketId,
      eventId: event.id,
      eventTitle: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      status: event.status,
      registeredAt: new Date().toISOString(),
      userName: formData.name,
      email: formData.email,
      company: formData.company,
      qrCode: qrUrl
    };

    try {
      const raw = localStorage.getItem('myTickets');
      const tickets = raw ? JSON.parse(raw) : [];
      tickets.push(ticket);
      localStorage.setItem('myTickets', JSON.stringify(tickets));
      
      Swal.fire({
        icon: 'success',
        title: 'Registration Successful!',
        html: `
          <div style="text-align: left; margin: 20px 0;">
            <p style="margin: 10px 0; font-size: 14px;"><strong>Ticket ID:</strong></p>
            <p style="margin: 10px 0 20px 0; font-family: monospace; background: #f0f9f8; padding: 10px; border-radius: 4px; border-left: 3px solid #0f766e; font-size: 13px; color: #0f766e;">${ticketId}</p>
            <p style="margin: 10px 0; font-size: 14px;"><strong>Event:</strong> ${event.title}</p>
            <p style="margin: 10px 0; font-size: 14px;"><strong>Attendee:</strong> ${formData.name}</p>
            <p style="margin: 10px 0 20px 0; font-size: 14px;"><strong>Confirmation sent to:</strong></p>
            <p style="margin: 10px 0; background: #ecfdf5; padding: 10px; border-radius: 4px; color: #0f766e; font-size: 13px;">${formData.email}</p>
          </div>
        `,
        confirmButtonText: 'Close',
        confirmButtonColor: '#0f766e',
        allowOutsideClick: false
      });
      
      setIsRegistered(true);
      setShowRegistrationForm(false);
      onClose();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: 'Failed to register. Please try again.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc2626'
      });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{event.title}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        {!showRegistrationForm ? (
          <div className="event-details" style={{ padding: '20px 30px 30px 30px' }}>
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
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</p>
                <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#333' }}>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time</p>
                <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#333' }}>{event.time}</p>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location</p>
                <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#333' }}>{event.location}</p>
              </div>
            </div>
            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Organizer</p>
                <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#333' }}>{event.organizerName || '—'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</p>
                <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#0f766e' }}>{event.organizerEmail || '—'}</p>
              </div>
              {/* {event.staff && event.staff.length > 0 && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Staff</p>
                  <div style={{ margin: '0', fontSize: '15px', color: '#333' }}>
                    {event.staff.map((staffMember, idx) => (
                      <p key={idx} style={{ margin: '4px 0', paddingLeft: '8px', borderLeft: '2px solid #d1fae5' }}>{staffMember}</p>
                    ))}
                  </div>
                </div>
              )} */}
            </div>
            <div className="modal-actions" style={{ marginTop: '20px', justifyContent: 'space-between' }}>
              <button className="btn-secondary" onClick={onClose}>Close</button>
              <button
                className="btn-primary"
                style={{ background: isRegistered ? '#9ca3af' : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', cursor: isRegistered ? 'not-allowed' : 'pointer' }}
                onClick={handleRegisterClick}
                disabled={isRegistered}
              >
                {isRegistered ? '✓ Already Registered' : 'Register'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRegister} style={{ padding: '20px 30px 30px 30px' }}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={formData.name}
                disabled
                readOnly
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                disabled
                readOnly
              />
            </div>
            <div className="form-group">
              <label>Company (Optional)</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Enter your company name"
              />
            </div>
            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button type="button" className="btn-secondary" onClick={() => setShowRegistrationForm(false)}>Back</button>
              <button type="submit" className="btn-primary">Confirm Registration</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BrowseEvents;
