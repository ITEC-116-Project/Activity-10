import React, { useState } from 'react';
import { MdEvent, MdPeople, MdStars } from 'react-icons/md';
import Swal from 'sweetalert2';
import Pagination from '../../components/Pagination';

const Home = ({ onRedirectToEdit }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState('card');

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
      description: 'A full-day technology conference covering AI, cloud, and modern web development.'
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
      description: 'Hands-on workshop focusing on React, TypeScript, and Vite best practices.'
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
      description: 'Executive seminar on scaling operations, finance strategies, and leadership.'
    },
    {
      id: 4,
      title: 'Digital Marketing Summit',
      date: '2026-02-22',
      time: '09:00 - 15:00',
      location: 'Quezon City Conference Hall',
      capacity: 300,
      registered: 178,
      status: 'upcoming',
      description: 'Learn the latest digital marketing strategies, SEO techniques, and social media trends.'
    },
    {
      id: 5,
      title: 'Data Science Bootcamp',
      date: '2026-03-05',
      time: '08:00 - 18:00',
      location: 'Taguig Tech Center',
      capacity: 150,
      registered: 142,
      status: 'upcoming',
      description: 'Intensive bootcamp covering Python, machine learning, and data visualization.'
    },
    {
      id: 6,
      title: 'UX/UI Design Workshop',
      date: '2026-01-28',
      time: '13:00 - 17:00',
      location: 'Pasig Creative Space',
      capacity: 80,
      registered: 65,
      status: 'ongoing',
      description: 'Practical workshop on user experience design principles and prototyping tools.'
    },
    {
      id: 7,
      title: 'Cybersecurity Awareness Training',
      date: '2026-02-10',
      time: '10:00 - 14:00',
      location: 'Ortigas Business District',
      capacity: 120,
      registered: 98,
      status: 'upcoming',
      description: 'Essential cybersecurity training for businesses and individuals.'
    },
    {
      id: 8,
      title: 'Mobile App Development Expo',
      date: '2026-03-18',
      time: '09:00 - 18:00',
      location: 'Mall of Asia Arena',
      capacity: 600,
      registered: 412,
      status: 'upcoming',
      description: 'Expo showcasing latest mobile technologies, frameworks, and app development tools.'
    },
    {
      id: 9,
      title: 'Startup Pitch Competition',
      date: '2026-02-28',
      time: '14:00 - 19:00',
      location: 'Alabang Town Center',
      capacity: 250,
      registered: 189,
      status: 'upcoming',
      description: 'Aspiring entrepreneurs pitch their startup ideas to venture capitalists and mentors.'
    },
    {
      id: 10,
      title: 'Cloud Computing Seminar',
      date: '2026-01-25',
      time: '10:00 - 15:00',
      location: 'Mandaluyong IT Park',
      capacity: 180,
      registered: 156,
      status: 'ongoing',
      description: 'Deep dive into AWS, Azure, and Google Cloud platforms and migration strategies.'
    },
    {
      id: 11,
      title: 'E-Commerce Growth Workshop',
      date: '2026-03-12',
      time: '13:00 - 18:00',
      location: 'Greenhills Shopping Center',
      capacity: 100,
      registered: 76,
      status: 'upcoming',
      description: 'Strategies for scaling e-commerce businesses and optimizing online sales.'
    },
    {
      id: 12,
      title: 'AI and Automation Conference',
      date: '2026-03-20',
      time: '08:30 - 17:30',
      location: 'PICC Manila',
      capacity: 450,
      registered: 321,
      status: 'upcoming',
      description: 'Conference exploring artificial intelligence, automation, and their business applications.'
    },
    {
      id: 13,
      title: 'Blockchain Technology Forum',
      date: '2026-02-18',
      time: '09:00 - 16:00',
      location: 'BGC Financial Center',
      capacity: 200,
      registered: 167,
      status: 'upcoming',
      description: 'Forum discussing blockchain applications, cryptocurrency, and decentralized finance.'
    },
    {
      id: 14,
      title: 'Game Development Meetup',
      date: '2026-03-08',
      time: '15:00 - 20:00',
      location: 'Eastwood City Game Hub',
      capacity: 120,
      registered: 94,
      status: 'upcoming',
      description: 'Meetup for game developers to showcase projects and discuss Unity and Unreal Engine.'
    },
    {
      id: 15,
      title: 'Project Management Certification',
      date: '2026-02-25',
      time: '08:00 - 17:00',
      location: 'Makati Executive Tower',
      capacity: 90,
      registered: 81,
      status: 'upcoming',
      description: 'Full-day certification training on agile methodologies and project management best practices.'
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
            <h3>Total Users</h3>
            <p className="stat-value">0</p>
          </div>
        </div>
        <div className="stat-card">
          <MdStars className="stat-icon" />
          <div className="stat-info">
            <h3>Active Organizers</h3>
            <p className="stat-value">0</p>
          </div>
        </div>
      </div>

      <div className="events-section">
        <h3>Upcoming & Ongoing Events</h3>
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

  const handleEdit = () => {
    onRedirectToEdit(event);
    onClose();
  };

  const handleRegister = () => {
    const ticketId = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const qrData = JSON.stringify({ ticketId, eventId: event.id, eventTitle: event.title, userName });
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
      userName,
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
        html: `<div style="text-align: left;">
          <div style="background: #f0f9f8; padding: 10px; margin: 8px 0; border-left: 3px solid #0f766e; border-radius: 4px;">
            <strong style="color: #0f766e;">Ticket ID:</strong> ${ticketId}
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
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: 'Please try again.',
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
              <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#333' }}>{event.organizerName || '—'}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</p>
              <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#0f766e' }}>{event.organizerEmail || '—'}</p>
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
