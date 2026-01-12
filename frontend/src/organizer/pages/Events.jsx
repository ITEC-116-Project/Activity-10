import React, { useEffect, useState } from 'react';
import { MdDelete } from 'react-icons/md';
import Swal from 'sweetalert2';
import Pagination from '../../components/Pagination';
import EventDetailsModal from '../components/EventDetailsModal';
import { deriveStatusKey, displayStatusLabel } from '../../shared/utils/eventStatus';
import CreateEventModal from '../components/CreateEventModal';
import { authService } from '../../shared/services/authService';

const Events = ({ initialEventToEdit, onClearEditEvent, onViewActiveEvent }) => {
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
        <EventDetailsModal
          event={selectedEvent}
          computedStatus={displayStatusLabel(selectedEvent)}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedEvent(null);
          }}
        />
      )}
      {showEditModal && editEventData && (
        <EditEventModal
          event={editEventData}
          onClose={() => { setShowEditModal(false); setEditEventData(null); }}
          onSave={(updated) => {
            setEvents(prev => prev.map(ev => String(ev.id) === String(updated.id) ? updated : ev));
            setShowEditModal(false);
            setEditEventData(null);
            try { window.dispatchEvent(new CustomEvent('event:updated', { detail: updated })); } catch {}
          }}
        />
      )}
          {showCreateModal && (
            <CreateEventModal onClose={() => setShowCreateModal(false)} onCreate={(data) => { createEvent(data); setShowCreateModal(false); }} />
          )}
        </div>
      );
    };

const EditEventModal = ({ event, onClose, onSave }) => {
  const parseInitial = (ev) => {
    const safe = ev || {};
    let startDate = '';
    let endDate = '';
    let startHour = '09', startMinute = '00', startAMPM = 'AM';
    let endHour = '10', endMinute = '00', endAMPM = 'AM';

    if (safe.date) {
      const d = new Date(safe.date);
      if (!isNaN(d.getTime())) startDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
    if (safe.endDate) {
      const d2 = new Date(safe.endDate);
      if (!isNaN(d2.getTime())) endDate = `${d2.getFullYear()}-${String(d2.getMonth()+1).padStart(2,'0')}-${String(d2.getDate()).padStart(2,'0')}`;
    }

    if (safe.time) {
      const parts = safe.time.split(' - ').map(s => s.trim());
      if (parts[0]) {
        const m = parts[0].match(/(\d{1,2}):(\d{2})\s*([AaPp][Mm])?/);
        if (m) {
          startHour = String(Number(m[1])).padStart(2,'0');
          startMinute = m[2];
          startAMPM = m[3] ? m[3].toUpperCase() : (Number(m[1])>=12 ? 'PM' : 'AM');
        }
      }
      if (parts[1]) {
        const m2 = parts[1].match(/(\d{1,2}):(\d{2})\s*([AaPp][Mm])?/);
        if (m2) {
          endHour = String(Number(m2[1])).padStart(2,'0');
          endMinute = m2[2];
          endAMPM = m2[3] ? m2[3].toUpperCase() : (Number(m2[1])>=12 ? 'PM' : 'AM');
        }
      }
    }

    const today = new Date();
    if (!startDate) startDate = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    if (!endDate) endDate = startDate;
    return { startDate, startHour, startMinute, startAMPM, endDate, endHour, endMinute, endAMPM };
  };

  const init = parseInitial(event);
  const todayLocalISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const toLocalISO = (isoOrDate) => {
    if (!isoOrDate) return null;
    const d = new Date(isoOrDate);
    if (isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const minDate = todayLocalISO();
  const [title, setTitle] = useState(event.title || '');
  const [startDate, setStartDate] = useState(init.startDate);
  const [startHour, setStartHour] = useState(init.startHour);
  const [startMinute, setStartMinute] = useState(init.startMinute);
  const [startAMPM, setStartAMPM] = useState(init.startAMPM);
  const [endDate, setEndDate] = useState(init.endDate);
  const [endHour, setEndHour] = useState(init.endHour);
  const [endMinute, setEndMinute] = useState(init.endMinute);
  const [endAMPM, setEndAMPM] = useState(init.endAMPM);
  const [location, setLocation] = useState(event.location || '');
  const [capacity, setCapacity] = useState(event.capacity || 0);
  const [description, setDescription] = useState(event.description || '');
  const [submitting, setSubmitting] = useState(false);
  const inputStyle = { width: '100%', padding: '12px 14px', border: '1px solid #d1d5db', borderRadius: '8px', boxSizing: 'border-box', color: '#111', backgroundColor: '#fff' };
  const selectStyle = { ...inputStyle, paddingRight: '36px' };
  const labelStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '13px',
    color: '#0f766e',
    fontWeight: 600,
    textTransform: 'none',
    letterSpacing: '0.01em'
  };
  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 32px 16px',
    borderBottom: '1px solid #e5e7eb'
  };
  const bodyStyle = {
    padding: '24px 32px 32px',
    display: 'grid',
    gap: '18px'
  };

  useEffect(() => {
    const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
    if (String(event.createdBy) !== String(userId)) {
      Swal.fire({ icon: 'warning', title: 'Unauthorized', text: 'You are not allowed to edit this event.', confirmButtonColor: '#0f766e' });
      onClose && onClose();
    }
  }, [event, onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
    if (String(event.createdBy) !== String(userId)) {
      Swal.fire({ icon: 'warning', title: 'Unauthorized', text: 'You are not allowed to edit this event.', confirmButtonColor: '#0f766e' });
      return;
    }
    if (!title.trim() || !startDate || !startHour || !startMinute || !startAMPM || !endDate || !endHour || !endMinute || !endAMPM || !location.trim() || !capacity) {
      Swal.fire({ icon: 'warning', title: 'Missing fields', text: 'Please fill all required fields.', confirmButtonColor: '#0f766e' });
      return;
    }
    const to24 = (hour12, minute, ampm) => {
      let h = Number(hour12);
      const m = String(minute).padStart(2,'0');
      if (ampm === 'AM' && h === 12) h = 0;
      if (ampm === 'PM' && h !== 12) h = h + 12;
      return `${String(h).padStart(2,'0')}:${m}`;
    };

    const startTime24 = to24(startHour, startMinute, startAMPM);
    const endTime24 = to24(endHour, endMinute, endAMPM);
    const startISO = new Date(`${startDate}T${startTime24}`).toISOString();
    const endISO = new Date(`${endDate}T${endTime24}`).toISOString();
    if (new Date(endISO) <= new Date(startISO)) {
      Swal.fire({ icon: 'warning', title: 'Invalid dates', text: 'End must be after start.', confirmButtonColor: '#0f766e' });
      return;
    }
    const origDate = event?.date ? toLocalISO(event.date) : null;
    if (new Date(startDate) < new Date(minDate) && startDate !== origDate) {
      Swal.fire({ icon: 'warning', title: 'Invalid start date', text: 'Start date cannot be in the past.', confirmButtonColor: '#0f766e' });
      return;
    }
    const startDt = new Date(startISO);
    const now = new Date();
    const origISO = event?.date ? new Date(event.date).toISOString() : null;
    if (startDate === todayLocalISO() && startDt.getTime() < now.getTime() && startISO !== origISO) {
      Swal.fire({ icon: 'warning', title: 'Invalid start time', text: 'Start time cannot be in the past.', confirmButtonColor: '#0f766e' });
      return;
    }

    const payload = {
      title: title.trim(),
      date: startISO,
      endDate: endISO,
      time: `${new Date(`${startDate}T${startTime24}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(`${endDate}T${endTime24}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      location: location.trim(),
      capacity: Number(capacity) || 0,
      description: description.trim(),
    };

    const origEndISO = event?.endDate ? new Date(event.endDate).toISOString() : null;
    if (endDate === todayLocalISO() && new Date(endISO).getTime() < now.getTime() && endISO !== origEndISO) {
      Swal.fire({ icon: 'warning', title: 'Invalid end time', text: 'End time cannot be in the past.', confirmButtonColor: '#0f766e' });
      return;
    }

    setSubmitting(true);
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/events/${event.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        setSubmitting(false);
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((updated) => {
        Swal.fire({ icon: 'success', title: 'Updated', text: 'Event updated successfully.', confirmButtonColor: '#0f766e' });
        onSave && onSave(updated);
      })
      .catch((err) => {
        setSubmitting(false);
        console.error('Update error', err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Could not update event.', confirmButtonColor: '#ef4444' });
      });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content modal-large"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '760px', padding: 0, overflow: 'hidden' }}
      >
        <div style={headerStyle}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', color: '#0f766e', fontWeight: 700 }}>Edit Event</h2>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6b7280' }}>Update the essentials before you publish changes.</p>
          </div>
          <button className="close-button" onClick={onClose} style={{ position: 'static', fontSize: '20px' }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={bodyStyle}>
          <label style={labelStyle}>
            Event Title *
            <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label style={labelStyle}>
            Description *
            <textarea
              rows="4"
              required
              style={{ ...inputStyle, minHeight: '110px', resize: 'vertical' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add or adjust notes for your attendees"
            />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>
                Date *
                <input type="date" min={minDate} value={startDate} onChange={(e) => {
                    const v = e.target.value;
                    setStartDate(v);
                    if (v > endDate) setEndDate(v);
                    const minutes = ['00','05','10','15','20','25','30','35','40','45','50','55'];
                    if (v === todayLocalISO()) {
                      const to24 = (hour12, minute, ampm) => {
                        let h = Number(hour12);
                        const mm = String(minute).padStart(2, '0');
                        if (ampm === 'AM' && h === 12) h = 0;
                        if (ampm === 'PM' && h !== 12) h = h + 12;
                        return `${String(h).padStart(2,'0')}:${mm}`;
                      };
                      if (minutes.every(m => new Date(`${v}T${to24(startHour,m,startAMPM)}`).getTime() < Date.now())) {
                        const found = minutes.find(m => new Date(`${v}T${to24(startHour,m,startAMPM)}`).getTime() >= Date.now());
                        if (found) setStartMinute(found);
                      }
                    }
                  }} required style={inputStyle} />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <select value={startHour} onChange={(e) => {
                    const v = e.target.value;
                    setStartHour(v);
                    const minutes = ['00','05','10','15','20','25','30','35','40','45','50','55'];
                    const today = todayLocalISO();
                    if (startDate === today) {
                      const to24 = (hour12, minute, ampm) => {
                        let h = Number(hour12);
                        const mm = String(minute).padStart(2, '0');
                        if (ampm === 'AM' && h === 12) h = 0;
                        if (ampm === 'PM' && h !== 12) h = h + 12;
                        return `${String(h).padStart(2,'0')}:${mm}`;
                      };
                      if (minutes.every(m => new Date(`${startDate}T${to24(v,m,startAMPM)}`).getTime() < Date.now())) {
                        const found = minutes.find(m => new Date(`${startDate}T${to24(v,m,startAMPM)}`).getTime() >= Date.now());
                        if (found) setStartMinute(found);
                      }
                    }
                }} style={selectStyle}>
                    {Array.from({ length: 12 }).map((_, i) => {
                      const v = String(i+1).padStart(2,'0');
                      const minutes = ['00','05','10','15','20','25','30','35','40','45','50','55'];
                      const isHourPast = startDate === todayLocalISO() && minutes.every(m => {
                        const to24 = (hour12, minute, ampm) => {
                          let h = Number(hour12);
                          const mm = String(minute).padStart(2, '0');
                          if (ampm === 'AM' && h === 12) h = 0;
                          if (ampm === 'PM' && h !== 12) h = h + 12;
                          return `${String(h).padStart(2,'0')}:${mm}`;
                        };
                        return new Date(`${startDate}T${to24(v,m,startAMPM)}`).getTime() < Date.now();
                      });
                      return <option key={v} value={v} disabled={isHourPast}>{v}</option>;
                    })}
                </select>
                <select value={startMinute} onChange={(e) => setStartMinute(e.target.value)} style={selectStyle}>
                    {['00','05','10','15','20','25','30','35','40','45','50','55'].map(m => {
                      const today = todayLocalISO();
                      if (startDate !== today) return <option key={m} value={m}>{m}</option>;
                      const to24 = (hour12, minute, ampm) => {
                        let h = Number(hour12);
                        const mm = String(minute).padStart(2, '0');
                        if (ampm === 'AM' && h === 12) h = 0;
                        if (ampm === 'PM' && h !== 12) h = h + 12;
                        return `${String(h).padStart(2,'0')}:${mm}`;
                      };
                      const t = to24(startHour, m, startAMPM);
                      const dt = new Date(`${startDate}T${t}`);
                      const isPast = dt.getTime() < Date.now();
                      return <option key={m} value={m} disabled={isPast}>{m}</option>;
                    })}
                </select>
                <select value={startAMPM} onChange={(e) => {
                    const v = e.target.value;
                    setStartAMPM(v);
                    const minutes = ['00','05','10','15','20','25','30','35','40','45','50','55'];
                    const today = todayLocalISO();
                    if (startDate === today) {
                      const to24 = (hour12, minute, ampm) => {
                        let h = Number(hour12);
                        const mm = String(minute).padStart(2, '0');
                        if (ampm === 'AM' && h === 12) h = 0;
                        if (ampm === 'PM' && h !== 12) h = h + 12;
                        return `${String(h).padStart(2,'0')}:${mm}`;
                      };
                      if (minutes.every(m => new Date(`${startDate}T${to24(startHour,m,v)}`).getTime() < Date.now())) {
                        const found = minutes.find(m => new Date(`${startDate}T${to24(startHour,m,v)}`).getTime() >= Date.now());
                        if (found) setStartMinute(found);
                      }
                    }
                }} style={selectStyle}>
                    <option>AM</option>
                    <option>PM</option>
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>
                End Date *
                <input type="date" min={startDate || minDate} value={endDate} onChange={(e) => {
                    const v = e.target.value;
                    setEndDate(v);
                    const minutes = ['00','05','10','15','20','25','30','35','40','45','50','55'];
                    const today = todayLocalISO();
                    if (v === today) {
                      const to24 = (hour12, minute, ampm) => {
                        let h = Number(hour12);
                        const mm = String(minute).padStart(2, '0');
                        if (ampm === 'AM' && h === 12) h = 0;
                        if (ampm === 'PM' && h !== 12) h = h + 12;
                        return `${String(h).padStart(2,'0')}:${mm}`;
                      };
                      if (minutes.every(m => new Date(`${v}T${to24(endHour,m,endAMPM)}`).getTime() < Date.now())) {
                        const found = minutes.find(m => new Date(`${v}T${to24(endHour,m,endAMPM)}`).getTime() >= Date.now());
                        if (found) setEndMinute(found);
                      }
                    }
                }} required style={inputStyle} />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <select value={endHour} onChange={(e) => setEndHour(e.target.value)} style={selectStyle}>
                    {Array.from({ length: 12 }).map((_, i) => {
                      const v = String(i+1).padStart(2,'0');
                      const minutes = ['00','05','10','15','20','25','30','35','40','45','50','55'];
                      const isHourPast = endDate === todayLocalISO() && minutes.every(m => {
                        const to24 = (hour12, minute, ampm) => {
                          let h = Number(hour12);
                          const mm = String(minute).padStart(2, '0');
                          if (ampm === 'AM' && h === 12) h = 0;
                          if (ampm === 'PM' && h !== 12) h = h + 12;
                          return `${String(h).padStart(2,'0')}:${mm}`;
                        };
                        return new Date(`${endDate}T${to24(v,m,endAMPM)}`).getTime() < Date.now();
                      });
                      return <option key={v} value={v} disabled={isHourPast}>{v}</option>;
                    })}
                  </select>
                <select value={endMinute} onChange={(e) => setEndMinute(e.target.value)} style={selectStyle}>
                    {['00','05','10','15','20','25','30','35','40','45','50','55'].map(m => {
                      const today = todayLocalISO();
                        if (endDate !== today) return <option key={m} value={m}>{m}</option>;
                      const to24 = (hour12, minute, ampm) => {
                        let h = Number(hour12);
                        const mm = String(minute).padStart(2, '0');
                        if (ampm === 'AM' && h === 12) h = 0;
                        if (ampm === 'PM' && h !== 12) h = h + 12;
                        return `${String(h).padStart(2,'0')}:${mm}`;
                      };
                      const t = to24(endHour, m, endAMPM);
                      const dt = new Date(`${endDate}T${t}`);
                      const isPast = dt.getTime() < Date.now();
                      return <option key={m} value={m} disabled={isPast}>{m}</option>;
                    })}
                  </select>
                <select value={endAMPM} onChange={(e) => setEndAMPM(e.target.value)} style={selectStyle}>
                    <option>AM</option>
                    <option>PM</option>
                </select>
              </div>
            </div>
          </div>
          <label style={labelStyle}>
            Location *
            <input style={inputStyle} value={location} onChange={(e) => setLocation(e.target.value)} required placeholder="Venue or address" />
          </label>
          <label style={labelStyle}>
            Capacity *
            <input type="number" min="0" style={inputStyle} value={capacity} onChange={(e) => setCapacity(e.target.value)} required />
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button type="button" className="btn-secondary" onClick={onClose} style={{ minWidth: '120px' }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting} style={{ minWidth: '150px' }}>{submitting ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};



export default Events;
