import React, { useEffect, useState } from 'react';
import { MdDelete } from 'react-icons/md';
import Swal from 'sweetalert2';
import Pagination from '../../components/Pagination';

const Events = ({ initialEventToEdit, onClearEditEvent }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editEventData, setEditEventData] = useState(null);
  const [viewMode, setViewMode] = useState('card');
  const [searchTerm, setSearchTerm] = useState(() => {
    try {
      return localStorage.getItem('eventsSearchTerm') || '';
    } catch {
      return '';
    }
  });
  const [filterStatus, setFilterStatus] = useState('all');
  const [events, setEvents] = useState([
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
    }
  ]);

  useEffect(() => {
    if (initialEventToEdit) {
      setEditEventData(initialEventToEdit);
      setShowEditModal(true);
      if (onClearEditEvent) onClearEditEvent();
    }
  }, [initialEventToEdit, onClearEditEvent]);

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
    try {
      localStorage.setItem('eventsSearchTerm', value);
    } catch {
      /* ignore storage errors */
    }
  };

  const handleFilterChange = (value) => {
    setFilterStatus(value);
    setCurrentPage(1);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setCurrentPage(1);
  };

  const handleDelete = (id) => {
    Swal.fire({
      icon: 'warning',
      title: 'Delete Event',
      text: 'Are you sure you want to delete this event? This action cannot be undone.',
      confirmButtonText: 'Delete',
      confirmButtonColor: '#dc2626',
      showCancelButton: true,
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setEvents((prev) => prev.filter((event) => event.id !== id));
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Event has been deleted successfully.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#0f766e'
        });
      }
    });
  };

  return (
    <div className="section">
      <div className="section-header" style={{ marginBottom: '0' }}>
        <h2>Events Management</h2>
        {/* <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary">View List</button>
        </div> */}
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search events by name or location..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        <select value={filterStatus} onChange={(e) => handleFilterChange(e.target.value)}>
          <option value="all">All Status</option>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="past">Past</option>
        </select>
        <select value={viewMode} onChange={(e) => handleViewModeChange(e.target.value)} className="view-mode-select">
          <option value="card">⊞ Cards</option>
          <option value="table">≡ Table</option>
        </select>
      </div>

      {viewMode === 'card' ? (
      <>
      <div className="events-grid">
        {events.filter(event => {
          const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) || event.location.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesFilter = filterStatus === 'all' ? true : event.status === filterStatus;
          return matchesSearch && matchesFilter;
        }).slice((currentPage - 1) * 5, currentPage * 5).map(event => (
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
            </div>
            <div className="event-actions">
              <button className="btn-secondary" onClick={() => { setSelectedEvent(event); setShowDetailsModal(true); }}>Details</button>
              <button className="btn-secondary" onClick={() => { setEditEventData(event); setShowEditModal(true); }}>Edit</button>
              <button className="btn-delete" onClick={() => handleDelete(event.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      {(() => {
        const filtered = events.filter(event => {
          const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) || event.location.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesFilter = filterStatus === 'all' ? true : event.status === filterStatus;
          return matchesSearch && matchesFilter;
        });
        return filtered.length > 5 && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filtered.length / 5)}
            onPageChange={setCurrentPage}
          />
        );
      })()}
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.filter(event => {
              const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) || event.location.toLowerCase().includes(searchTerm.toLowerCase());
              const matchesFilter = filterStatus === 'all' ? true : event.status === filterStatus;
              return matchesSearch && matchesFilter;
            }).slice((currentPage - 1) * 10, currentPage * 10).map(event => (
              <tr key={event.id}>
                <td>{event.title}</td>
                <td>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                <td>{event.time}</td>
                <td>{event.location}</td>
                <td>{event.registered} / {event.capacity}</td>
                <td><span className={`status-badge ${event.status}`}>{event.status}</span></td>
                <td style={{ textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button className="btn-secondary" onClick={() => { setSelectedEvent(event); setShowDetailsModal(true); }} style={{ padding: '6px 12px', fontSize: '13px' }}>View</button>
                  <button className="btn-secondary" onClick={() => { setEditEventData(event); setShowEditModal(true); }} style={{ padding: '6px 12px', fontSize: '13px' }}>Edit</button>
                  <button className="btn-delete" onClick={() => handleDelete(event.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(() => {
        const filtered = events.filter(event => {
          const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) || event.location.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesFilter = filterStatus === 'all' ? true : event.status === filterStatus;
          return matchesSearch && matchesFilter;
        });
        return filtered.length > 10 && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filtered.length / 10)}
            onPageChange={setCurrentPage}
          />
        );
      })()}
      </>
      )}

      {showDetailsModal && selectedEvent && (
        <EventDetailsModal event={selectedEvent} onClose={() => { setShowDetailsModal(false); setSelectedEvent(null); }} />
      )}
      {showEditModal && editEventData && (
        <EditEventModal event={editEventData} onClose={() => { setShowEditModal(false); setEditEventData(null); }} />
      )}
    </div>
  );
};

const EditEventModal = ({ event, onClose }) => {
  const [formData, setFormData] = useState({
    title: event.title || '',
    description: event.description || '',
    date: event.date || '',
    time: event.time || '',
    location: event.location || '',
    capacity: event.capacity || '',
    category: event.category || '',
    status: event.status || 'upcoming'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Update event:', formData);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Event</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Event Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Description *</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="4"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Time *</label>
              <input
                type="time"
                required
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Location *</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Capacity *</label>
              <input
                type="number"
                required
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="">Select category</option>
                <option value="conference">Conference</option>
                <option value="workshop">Workshop</option>
                <option value="seminar">Seminar</option>
                <option value="meetup">Meetup</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="past">Past</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CreateEventModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    capacity: '',
    category: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Create event:', formData);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Event</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Event Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter event title"
            />
          </div>
          <div className="form-group">
            <label>Description *</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter event description"
              rows="4"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Time *</label>
              <input
                type="time"
                required
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Location *</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Enter event location"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Capacity *</label>
              <input
                type="number"
                required
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                placeholder="Max attendees"
              />
            </div>
            <div className="form-group">
              <label>Category *</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="">Select category</option>
                <option value="conference">Conference</option>
                <option value="workshop">Workshop</option>
                <option value="seminar">Seminar</option>
                <option value="meetup">Meetup</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Create Event</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EventDetailsModal = ({ event, onClose }) => {
  const userName = localStorage.getItem('firstName') || sessionStorage.getItem('firstName') || 'Admin';
  const [isRegistered, setIsRegistered] = useState(() => {
    try {
      const raw = localStorage.getItem('myTickets');
      const tickets = raw ? JSON.parse(raw) : [];
      return tickets.some(t => t.eventId === event.id && t.userName === userName);
    } catch {
      return false;
    }
  });

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

export default Events;
