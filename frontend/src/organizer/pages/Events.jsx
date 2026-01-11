import React, { useEffect, useState } from 'react';
import { MdDelete, MdFileDownload } from 'react-icons/md';
import Swal from 'sweetalert2';
import Pagination from '../../components/Pagination';
import EventDetailsModal from '../components/EventDetailsModal';
import { deriveStatusKey, displayStatusLabel } from '../../shared/utils/eventStatus';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import CreateEventModal from '../components/CreateEventModal';
import { authService } from '../../shared/services/authService';

const Events = ({ initialEventToEdit, onClearEditEvent, onViewActiveEvent }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
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
  // status filter removed per request
  const loadInitialEvents = () => {
    try {
      const raw = localStorage.getItem('events');
      if (raw) return JSON.parse(raw);
    } catch { /* ignore parse errors */ }

    return [
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
    ];
  };

  const [events, setEvents] = useState(loadInitialEvents());

  useEffect(() => {
    if (initialEventToEdit) {
      setEditEventData(initialEventToEdit);
      setShowEditModal(true);
      if (onClearEditEvent) onClearEditEvent();
    }
  }, [initialEventToEdit, onClearEditEvent]);

  useEffect(() => {
    const handler = (e) => {
      const updated = e.detail;
      if (!updated) return;
      setEvents(prev => prev.map(ev => String(ev.id) === String(updated.id) ? updated : ev));
    };
    window.addEventListener('event:updated', handler);
    return () => window.removeEventListener('event:updated', handler);
  }, []);

  // Load events created by the currently logged-in user so this page shows that user's events
  useEffect(() => {
    const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
    if (!userId) return;
    const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const loadByCreator = () => {
      fetch(`${base}/events/by-creator/${userId}`)
        .then(async (res) => {
          if (!res.ok) throw new Error(await res.text());
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data)) setEvents(data);
        })
        .catch((err) => {
          console.error('Failed to load events by creator', err);
        });
    };

    loadByCreator();
    const poll = setInterval(loadByCreator, 60_000);
    return () => clearInterval(poll);
  }, []);

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
    try {
      localStorage.setItem('eventsSearchTerm', value);
    } catch {
      /* ignore storage errors */
    }
  };

  // status filter handler removed

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setCurrentPage(1);
  };

  // Compute filtered and prioritized events so 'ongoing' appears first
  const rankStatus = (s) => (s === 'ongoing' ? 0 : s === 'upcoming' ? 1 : (s === 'past' || s === 'completed') ? 2 : 3);

  // deriveStatusKey and displayStatusLabel are provided by shared utils

  // Show events created by the currently logged-in user (if any)
  const currentRole = authService.getRole();
  const currentUserId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
  const visibleEvents = currentUserId ? events.filter(e => String(e.createdBy) === String(currentUserId)) : events;

  const filteredEvents = visibleEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) || event.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const prioritizedEvents = filteredEvents.slice().sort((a, b) => rankStatus(deriveStatusKey(a)) - rankStatus(deriveStatusKey(b)));

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
        setEvents((prev) => {
          const updated = prev.filter((event) => event.id !== id);
          try { localStorage.setItem('events', JSON.stringify(updated)); } catch { /* ignore */ }
          return updated;
        });
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

  const createEvent = (newEvent) => {
    // Fallback local creation (keeps previous behavior) if API not available
    (async () => {
      try {
        const start = new Date(`${newEvent.date}T${newEvent.startTime}`);
        const end = new Date(`${newEvent.date}T${newEvent.endTime}`);
        const payload = {
          title: newEvent.title,
          date: start.toISOString(),
          endDate: end.toISOString(),
          time: `${newEvent.startTime} - ${newEvent.endTime}`,
          location: newEvent.location,
          capacity: Number(newEvent.capacity) || 0,
          registered: 0,
          status: (new Date() < start) ? 'upcoming' : ((new Date() >= start && new Date() <= end) ? 'ongoing' : 'completed'),
          description: newEvent.description || '',
          createdBy: sessionStorage.getItem('userId') || localStorage.getItem('userId'),
          createdByName: `${localStorage.getItem('firstName') || sessionStorage.getItem('firstName') || ''} ${localStorage.getItem('lastName') || sessionStorage.getItem('lastName') || ''}`.trim() || 'Organizer',
          createdByFirstName: localStorage.getItem('firstName') || sessionStorage.getItem('firstName') || '',
          createdByLastName: localStorage.getItem('lastName') || sessionStorage.getItem('lastName') || '',
          createdByEmail: localStorage.getItem('email') || sessionStorage.getItem('email') || ''
        };

        const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const res = await fetch(`${base}/events`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || 'Failed to create event on server');
        }
        const created = await res.json();

        // Add to local list shown on this page
        setEvents(prev => {
          const updated = [created, ...prev];
          try { localStorage.setItem('events', JSON.stringify(updated)); } catch { /* ignore */ }
          return updated;
        });

        // Notify other pages (Home.jsx) to update immediately
        try {
          window.dispatchEvent(new CustomEvent('event:created', { detail: created }));
        } catch {}

        Swal.fire({ icon: 'success', title: 'Event Created', text: 'New event has been added successfully.', confirmButtonColor: '#0f766e', confirmButtonText: 'OK' });
      } catch (err) {
        console.error('Create event error', err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Could not create event. Please try again.', confirmButtonColor: '#ef4444' });
      }
    })();
  };

  return (
    <div className="section">
      <div className="section-header" style={{ marginBottom: '0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2>Events Management</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>+ Add New Event</button>
        </div>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search events by name or location..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        {/* Status filter removed */}
        <select value={viewMode} onChange={(e) => handleViewModeChange(e.target.value)} className="view-mode-select">
          <option value="card">⊞ Cards</option>
          <option value="table">≡ Table</option>
        </select>
      </div>

      {authService.getRole() === 'organizer' && (
        <div style={{ margin: '12px 0 20px 0', padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#065f46', borderRadius: 6 }}>
          Showing events created by <strong>{localStorage.getItem('firstName') || sessionStorage.getItem('firstName') || 'you'}</strong> only. Use <strong>+ Add New Event</strong> to create more.
        </div>
      )}

      {prioritizedEvents.length === 0 ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#6b7280' }}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>No events found.</p>
          {authService.getRole() === 'organizer' ? (
            <p style={{ marginBottom: '12px' }}>You haven't created any events yet. Click <strong>+ Add New Event</strong> to create one.</p>
          ) : (
            <p style={{ marginBottom: '12px' }}>No events match your filters.</p>
          )}
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>+ Add New Event</button>
        </div>
      ) : (
      (viewMode === 'card') ? (
      <>
      <div className="events-grid">
        {prioritizedEvents.slice((currentPage - 1) * 5, currentPage * 5).map(event => (
          <div key={event.id} className="event-card">
            <div className="event-header">
              <h4>{event.title}</h4>
            </div>
            <div className="event-details">
              <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p><strong>Time:</strong> {event.time}</p>
              <p><strong>Location:</strong> {event.location}</p>
              <p><strong>Capacity:</strong> {event.registered} / {event.capacity}</p>
            </div>
            <div className="event-actions">
              {deriveStatusKey(event) === 'ongoing' ? (
                <button className="btn-primary" onClick={() => onViewActiveEvent && onViewActiveEvent(event)}>View</button>
              ) : (
                <>
                  <button className="btn-secondary" onClick={() => { setSelectedEvent(event); setShowDetailsModal(true); }}>Details</button>
                  <button className="btn-secondary" onClick={() => { setEditEventData(event); setShowEditModal(true); }}>Edit</button>
                  <button className="btn-delete" onClick={() => handleDelete(event.id)}>Delete</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      {prioritizedEvents.length > 5 && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(prioritizedEvents.length / 5)}
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {prioritizedEvents.slice((currentPage - 1) * 10, currentPage * 10).map(event => (
              <tr key={event.id}>
                <td>{event.title}</td>
                <td>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                <td>{event.time}</td>
                <td>{event.location}</td>
                <td>{event.registered} / {event.capacity}</td>
                <td style={{ textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  {deriveStatusKey(event) === 'ongoing' ? (
                    <button className="btn-primary" onClick={() => onViewActiveEvent && onViewActiveEvent(event)} style={{ padding: '6px 12px', fontSize: '13px' }}>View</button>
                  ) : (
                    <>
                      <button className="btn-secondary" onClick={() => { setSelectedEvent(event); setShowDetailsModal(true); }} style={{ padding: '6px 12px', fontSize: '13px' }}>View</button>
                      <button className="btn-secondary" onClick={() => { setEditEventData(event); setShowEditModal(true); }} style={{ padding: '6px 12px', fontSize: '13px' }}>Edit</button>
                      <button className="btn-delete" onClick={() => handleDelete(event.id)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {prioritizedEvents.length > 10 && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(prioritizedEvents.length / 10)}
          onPageChange={setCurrentPage}
        />
      )}
      </>
      )
      )}

      {showDetailsModal && selectedEvent && (
        <EventDetailsModal event={selectedEvent} computedStatus={displayStatusLabel(selectedEvent)} onClose={() => { setShowDetailsModal(false); setSelectedEvent(null); }} onShowParticipants={() => { setShowDetailsModal(false); setShowParticipantsModal(true); }} />
      )}
      {showEditModal && editEventData && (
        <EditEventModal event={editEventData} onClose={() => { setShowEditModal(false); setEditEventData(null); }} />
      )}
      {showParticipantsModal && selectedEvent && (
        <ParticipantsModal event={selectedEvent} onClose={() => { setShowParticipantsModal(false); setSelectedEvent(null); }} />
      )}
          {showCreateModal && (
            <CreateEventModal onClose={() => setShowCreateModal(false)} onCreate={(data) => { createEvent(data); setShowCreateModal(false); }} />
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
    category: event.category || ''
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
          {/* Status removed from edit form per request */}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};



const ParticipantsModal = ({ event, onClose }) => {
  const [participants, setParticipants] = useState(() => {
    try {
      const raw = localStorage.getItem('myTickets');
      const tickets = raw ? JSON.parse(raw) : [];
      return tickets.filter(t => t.eventId === event.id);
    } catch {
      return [];
    }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [checkedInParticipants, setCheckedInParticipants] = useState(new Set());

  const itemsPerPage = 10;

  const filteredParticipants = participants.filter(p => {
    const matchesSearch = 
      p.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.ticketId.includes(searchTerm);
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredParticipants.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentParticipants = filteredParticipants.slice(startIndex, startIndex + itemsPerPage);

  const handleCheckIn = (participantId) => {
    setCheckedInParticipants(prev => new Set([...prev, participantId]));
    Swal.fire({
      icon: 'success',
      title: 'Checked In!',
      text: 'Participant successfully checked in.',
      confirmButtonColor: '#0f766e',
      confirmButtonText: 'OK'
    });
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFontSize(16);
    doc.setTextColor(15, 118, 110);
    doc.text(`${event.title} - Attendee List`, 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    const eventDate = new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Date: ${eventDate}`, 14, 28);
    doc.text(`Location: ${event.location}`, 14, 35);
    doc.text(`Total Attendees: ${participants.length}`, 14, 42);

    const tableData = participants.map(p => [
      p.userName,
      p.email || 'N/A',
      p.ticketId,
      new Date(p.registeredAt).toLocaleDateString('en-US'),
      checkedInParticipants.has(p.id) ? '✓' : '—'
    ]);

    doc.autoTable({
      head: [['Name', 'Email', 'Ticket ID', 'Registration Date', 'Check-in']],
      body: tableData,
      startY: 50,
      theme: 'striped',
      headerStyles: {
        fillColor: [15, 118, 110],
        textColor: 255,
        fontStyle: 'bold'
      },
      margin: { top: 50 }
    });

    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated on ${new Date().toLocaleString('en-US')}`, 14, pageHeight - 10);

    doc.save(`${event.title.replace(/\s+/g, '_')}_attendees.pdf`);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Participants - {event.title}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div style={{ padding: '20px 30px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search by name, email, or ticket ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{ flex: 1, minWidth: '250px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <button 
              className="btn-secondary"
              onClick={() => setScannerOpen(!scannerOpen)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              📱 QR Scanner
            </button>
            <button 
              className="btn-secondary"
              onClick={exportPDF}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <MdFileDownload /> PDF
            </button>
          </div>

          {scannerOpen && (
            <div style={{
              padding: '15px',
              backgroundColor: '#f0f9f8',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '2px dashed #0f766e'
            }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: '600', color: '#0f766e' }}>📱 QR Code Scanner</p>
              <p style={{ margin: '0', fontSize: '13px', color: '#666' }}>Click on a participant's QR code to simulate scanning, or use device camera.</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#999' }}>Note: Enable camera access when prompted by your browser.</p>
            </div>
          )}

          <div className="events-table-container">
            <table className="events-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Ticket ID</th>
                  <th>Registration Date</th>
                  <th>Check-in Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentParticipants.length > 0 ? (
                  currentParticipants.map(p => (
                    <tr key={p.id}>
                      <td><strong>{p.userName}</strong></td>
                      <td>{p.email || '—'}</td>
                      <td style={{ fontSize: '12px', fontFamily: 'monospace', color: '#0f766e' }}>{p.ticketId}</td>
                      <td>{new Date(p.registeredAt).toLocaleDateString('en-US')}</td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: checkedInParticipants.has(p.id) ? '#d1fae5' : '#fef3c7',
                          color: checkedInParticipants.has(p.id) ? '#065f46' : '#92400e'
                        }}>
                          {checkedInParticipants.has(p.id) ? '✓ Checked In' : '⏳ Pending'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {!checkedInParticipants.has(p.id) ? (
                          <button
                            className="btn-secondary"
                            onClick={() => handleCheckIn(p.id)}
                            style={{ padding: '5px 10px', fontSize: '12px' }}
                          >
                            Check In
                          </button>
                        ) : (
                          <span style={{ color: '#0f766e', fontWeight: '600' }}>✓ Done</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>
                      <p style={{ margin: '0', color: '#999' }}>No participants found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredParticipants.length > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}

          <div className="modal-actions" style={{ marginTop: '20px' }}>
            <button className="btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Events;
