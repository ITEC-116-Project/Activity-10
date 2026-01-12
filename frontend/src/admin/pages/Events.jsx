import React, { useEffect, useMemo, useState } from 'react';
import { MdDelete, MdFileDownload } from 'react-icons/md';
import Swal from 'sweetalert2';
import Pagination from '../../components/Pagination';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialEventToEdit) {
      setEditEventData(initialEventToEdit);
      setShowEditModal(true);
      if (onClearEditEvent) onClearEditEvent();
    }
  }, [initialEventToEdit, onClearEditEvent]);

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${base}/events`);
        if (!res.ok) throw new Error(`Failed to load events (${res.status})`);
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

    fetchEvents();
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

      {error && (
        <div style={{ padding: '10px', margin: '10px 0', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#991b1b' }}>
          {error}
        </div>
      )}
      {loading && (
        <div style={{ padding: '16px', margin: '8px 0', textAlign: 'center', color: '#555' }}>Loading events...</div>
      )}

      {viewMode === 'card' ? (
      <>
      <div className="events-grid">
        {events.filter(event => {
          const status = (event.status || '').toLowerCase();
          const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) || event.location.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesFilter = filterStatus === 'all' ? true : (filterStatus === 'past' ? status === 'past' || status === 'completed' : status === filterStatus);
          return matchesSearch && matchesFilter;
        }).slice((currentPage - 1) * 5, currentPage * 5).map(event => {
          const isPast = (event.status || '').toLowerCase() === 'completed' || (event.status || '').toLowerCase() === 'past';
          return (
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
              <button
                className="btn-secondary"
                onClick={() => { if (isPast) return; setEditEventData(event); setShowEditModal(true); }}
                disabled={isPast}
                title={isPast ? 'Cannot edit past events' : 'Edit event'}
              >
                Edit
              </button>
              <button className="btn-delete" onClick={() => handleDelete(event.id)}>Delete</button>
            </div>
          </div>
        );
        })}
      </div>
      {(() => {
        const filtered = events.filter(event => {
          const status = (event.status || '').toLowerCase();
          const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) || event.location.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesFilter = filterStatus === 'all' ? true : (filterStatus === 'past' ? status === 'past' || status === 'completed' : status === filterStatus);
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
              const status = (event.status || '').toLowerCase();
              const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) || event.location.toLowerCase().includes(searchTerm.toLowerCase());
              const matchesFilter = filterStatus === 'all' ? true : (filterStatus === 'past' ? status === 'past' || status === 'completed' : status === filterStatus);
              return matchesSearch && matchesFilter;
            }).slice((currentPage - 1) * 10, currentPage * 10).map(event => {
              const isPast = (event.status || '').toLowerCase() === 'completed' || (event.status || '').toLowerCase() === 'past';
              return (
              <tr key={event.id}>
                <td>{event.title}</td>
                <td>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                <td>{event.time}</td>
                <td>{event.location}</td>
                <td>{event.registered} / {event.capacity}</td>
                <td><span className={`status-badge ${event.status}`}>{event.status}</span></td>
                <td style={{ textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button className="btn-secondary" onClick={() => { setSelectedEvent(event); setShowDetailsModal(true); }} style={{ padding: '6px 12px', fontSize: '13px' }}>View</button>
                  <button className="btn-secondary" onClick={() => { if (isPast) return; setEditEventData(event); setShowEditModal(true); }} disabled={isPast} style={{ padding: '6px 12px', fontSize: '13px' }} title={isPast ? 'Cannot edit past events' : 'Edit event'}>Edit</button>
                  <button className="btn-delete" onClick={() => handleDelete(event.id)}>Delete</button>
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
      {(() => {
        const filtered = events.filter(event => {
          const status = (event.status || '').toLowerCase();
          const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) || event.location.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesFilter = filterStatus === 'all' ? true : (filterStatus === 'past' ? status === 'past' || status === 'completed' : status === filterStatus);
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

  const handleSubmit = (e) => {
    e.preventDefault();
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

const PARTICIPANTS_PER_PAGE = 5;

const EventDetailsModal = ({ event, onClose }) => {
  const userName = localStorage.getItem('firstName') || sessionStorage.getItem('firstName') || 'Admin';
  const [isRegistered, setIsRegistered] = useState(() => {
    try {
      const raw = localStorage.getItem('myTickets');
      const tickets = raw ? JSON.parse(raw) : [];
      return tickets.some((t) => t.eventId === event.id && t.userName === userName);
    } catch {
      return false;
    }
  });
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const seedFromLocal = () => {
      try {
        const raw = localStorage.getItem('myTickets');
        const tickets = raw ? JSON.parse(raw) : [];
        return tickets.some((t) => t.eventId === event.id && t.userName === userName);
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
        if (token) headers.Authorization = `Bearer ${token}`;

        const response = await fetch(`${base}/events/admin/${adminId}/registrations`, { headers });
        if (!response.ok) throw new Error('Failed to verify registration status');

        const registrations = await response.json();
        const alreadyRegistered = Array.isArray(registrations)
          ? registrations.some((registration) => {
              const regEventId = registration.eventId ?? registration.event?.id;
              return Number(regEventId) === Number(event.id);
            })
          : false;

        if (isActive) setIsRegistered(alreadyRegistered);
      } catch (error) {
        console.error('Failed to check registration status', error);
      }
    };

    verifyRegistration();
    return () => {
      isActive = false;
    };
  }, [event.id, userName]);

  useEffect(() => {
    let cancelled = false;

    const fetchParticipants = async () => {
      try {
        setLoadingParticipants(true);
        const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await fetch(`${base}/events/${event.id}/attendees`);
        if (!response.ok) throw new Error('Failed to load participants');
        const data = await response.json();
        if (!cancelled) setParticipants(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load participants', err);
        if (!cancelled) setParticipants([]);
      } finally {
        if (!cancelled) setLoadingParticipants(false);
      }
    };

    fetchParticipants();
    return () => {
      cancelled = true;
    };
  }, [event.id]);

  useEffect(() => {
    setPage(1);
  }, [event.id]);

  const normalizedStatus = (value) => {
    if (!value) return 'Inactive';
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const participantName = (participant) => {
    if (participant.attendeeName) return participant.attendeeName;
    if (participant.attendee && participant.attendee.firstName) {
      return `${participant.attendee.firstName} ${participant.attendee.lastName || ''}`.trim();
    }
    if (participant.admin && participant.admin.firstName) {
      return `${participant.admin.firstName} ${participant.admin.lastName || ''}`.trim();
    }
    return '—';
  };

  const participantEmail = (participant) => {
    if (participant.email) return participant.email;
    if (participant.attendee && participant.attendee.email) return participant.attendee.email;
    if (participant.admin && participant.admin.email) return participant.admin.email;
    if (participant.attendeeEmail) return participant.attendeeEmail;
    if (participant.adminEmail) return participant.adminEmail;
    return '—';
  };

  const filteredParticipants = useMemo(() => {
    if (!searchTerm) return participants;
    const needle = searchTerm.toLowerCase();
    return participants.filter((participant) => {
      const name = participantName(participant).toLowerCase();
      const email = participantEmail(participant).toLowerCase();
      const ticket = (participant.ticketCode || '').toLowerCase();
      return name.includes(needle) || ticket.includes(needle) || email.includes(needle);
    });
  }, [participants, searchTerm]);

  const totalPages = Math.ceil(filteredParticipants.length / PARTICIPANTS_PER_PAGE) || 0;
  const currentPage = totalPages ? Math.min(page, totalPages) : 1;
  const paginatedParticipants = filteredParticipants.slice(
    (currentPage - 1) * PARTICIPANTS_PER_PAGE,
    currentPage * PARTICIPANTS_PER_PAGE
  );

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const statusLabel = normalizedStatus(event.status);

    doc.setFillColor(15, 118, 110);
    doc.rect(0, 0, pageWidth, 45, 'F');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text('ATTENDANCE REPORT', margin, 18);
    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    doc.text(event.title || 'Event', margin, 28);

    let yPos = 55;
    doc.setFontSize(11);
    doc.setTextColor(15, 118, 110);
    doc.setFont(undefined, 'bold');
    doc.text('EVENT INFORMATION', margin, yPos);

    yPos += 8;
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.setFont(undefined, 'normal');
    const eventDetails = [
      { label: 'Date:', value: new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
      { label: 'Time:', value: event.time || '—' },
      { label: 'Location:', value: event.location || '—' },
      { label: 'Organizer:', value: `${event.createdByFirstName || ''} ${event.createdByLastName || ''}`.trim() || event.organizerName || 'N/A' },
      { label: 'Email:', value: event.createdByEmail || event.organizerEmail || 'N/A' },
      { label: 'Status:', value: statusLabel },
      { label: 'Description:', value: event.description || 'N/A' }
    ];

    eventDetails.forEach(({ label, value }) => {
      doc.setFont(undefined, 'bold');
      doc.text(label, margin, yPos);
      doc.setFont(undefined, 'normal');
      const text = doc.splitTextToSize(String(value), pageWidth - margin * 2 - 25);
      doc.text(text, margin + 25, yPos);
      yPos += 6 * text.length;
    });

    yPos += 5;
    doc.setFillColor(230, 240, 240);
    doc.rect(margin, yPos - 4, pageWidth - margin * 2, 30, 'F');
    doc.setFontSize(11);
    doc.setTextColor(15, 118, 110);
    doc.setFont(undefined, 'bold');
    doc.text('ATTENDANCE SUMMARY', margin + 3, yPos + 2);

    yPos += 8;
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.setFont(undefined, 'normal');
    const summary = [
      { label: 'Total Capacity:', value: event.capacity || 0 },
      { label: 'Total Registered:', value: participants.length },
      { label: 'Attendance Rate:', value: event.capacity ? `${((participants.length / event.capacity) * 100).toFixed(1)}%` : '0%' }
    ];
    summary.forEach(({ label, value }) => {
      doc.setFont(undefined, 'bold');
      doc.text(label, margin + 3, yPos);
      doc.setFont(undefined, 'normal');
      doc.text(String(value), pageWidth - margin - 40, yPos);
      yPos += 6;
    });

    yPos += 8;
    const tableData = filteredParticipants.map((participant) => {
      const dateText = participant.registeredAt ? new Date(participant.registeredAt).toLocaleDateString('en-US') : '—';
      const timeText = participant.registeredAt ? new Date(participant.registeredAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';
      const ticket = participant.ticketCode ? participant.ticketCode.substring(0, 20) + (participant.ticketCode.length > 20 ? '…' : '') : 'N/A';
      return [
        participantName(participant) || 'N/A',
        participantEmail(participant),
        dateText,
        timeText,
        ticket,
        normalizedStatus(participant.status || 'inactive')
      ];
    });

    if (tableData.length) {
      autoTable(doc, {
        head: [['Participant Name', 'Email', 'Registration Date', 'Time', 'Ticket ID', 'Status']],
        body: tableData,
        startY: yPos,
        theme: 'grid',
        headStyles: {
          fillColor: [15, 118, 110],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10,
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [50, 50, 50]
        },
        alternateRowStyles: {
          fillColor: [245, 250, 250]
        },
        columnStyles: {
          0: { halign: 'left' },
          1: { halign: 'left' },
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'left', fontSize: 8 },
          5: { halign: 'center' }
        },
        margin: { left: margin, right: margin },
        didDrawPage: (data) => {
          const pageHeight = doc.internal.pageSize.getHeight();
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(`Generated on ${new Date().toLocaleString('en-US')}`, margin, pageHeight - 8);
          doc.text(`Page ${data.pageNumber} of ${data.pageCount}`, pageWidth - margin - 30, pageHeight - 8);
        }
      });
    } else {
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text('No participants registered yet.', margin, yPos + 6);
    }

    doc.save(`${(event.title || 'Event').replace(/\s+/g, '_')}_Attendance_Report.pdf`);
  };

  const handleRegister = async () => {
    const ticketCode = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const qrData = JSON.stringify({ ticketCode, eventId: event.id, eventTitle: event.title, userName });
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;

    try {
      const adminId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      if (!adminId) throw new Error('User not authenticated');

      const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const response = await fetch(`${base}/events/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          eventId: event.id,
          adminId: parseInt(adminId, 10),
          attendeeName: userName,
          ticketCode
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to register for event');
      }

      const registration = await response.json();
      const ticket = {
        id: registration.id,
        ticketId: ticketCode,
        ticketCode,
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

  const statusLabel = normalizedStatus(event.status);
  const progressPercent = Math.min(((event.registered || 0) / Math.max(event.capacity || 1, 1)) * 100, 100);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 'min(1280px, calc(100vw - 48px))', maxWidth: 'none' }}
      >
        <div className="modal-header modal-header-row">
          <h2>{event.title}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div
          style={{
            padding: '20px 30px 30px 30px',
            display: 'grid',
            gridTemplateColumns: 'minmax(360px, 1fr) minmax(520px, 1.6fr)',
            gap: '36px'
          }}
        >
          <div>
            {event.description && (
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f9f8', borderLeft: '4px solid #0f766e', borderRadius: '4px' }}>
                <p style={{ margin: 0, color: '#333', lineHeight: '1.6' }}>{event.description}</p>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</p>
                <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#333' }}>
                  <span className={`status-badge ${(event.status || 'inactive').toLowerCase()}`}>{statusLabel}</span>
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Capacity</p>
                <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#333' }}>{event.registered} / {event.capacity}</p>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Capacity Progress</p>
                <div className="progress-bar" style={{ marginTop: '8px' }}>
                  <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
                </div>
              </div>
            </div>
            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Organizer</p>
                <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#333' }}>{`${event.createdByFirstName || ''} ${event.createdByLastName || ''}`.trim() || event.organizerName || event.createdByName || '—'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</p>
                <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#0f766e' }}>{event.createdByEmail || event.organizerEmail || '—'}</p>
              </div>
              {event.staff && event.staff.length > 0 && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Staff</p>
                  <div style={{ margin: 0, fontSize: '15px', color: '#333' }}>
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
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</p>
                <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#333' }}>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time</p>
                <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#333' }}>{event.time}</p>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location</p>
                <p style={{ margin: 0, fontSize: '15px', color: '#333' }}>{event.location}</p>
              </div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search by name, email, or ticket ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                style={{ flex: 1, minWidth: '240px', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
              <button
                className="btn-secondary"
                onClick={handleDownloadPdf}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <MdFileDownload /> PDF
              </button>
            </div>
            <div className="events-table-container" style={{ maxHeight: '360px', overflowY: 'auto' }}>
              <table className="events-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Ticket ID</th>
                    <th>Registration Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingParticipants ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '18px', color: '#6b7280' }}>Loading participants...</td>
                    </tr>
                  ) : filteredParticipants.length ? (
                    paginatedParticipants.map((participant) => (
                      <tr key={participant.id}>
                        <td><strong>{participantName(participant)}</strong></td>
                        <td>{participantEmail(participant)}</td>
                        <td style={{ fontSize: '12px', fontFamily: 'monospace', color: '#0f766e' }}>{participant.ticketCode || '—'}</td>
                        <td>{participant.registeredAt ? new Date(participant.registeredAt).toLocaleDateString('en-US') : '—'}</td>
                        <td>
                          <span className={`status-badge ${(participant.status || 'inactive').toLowerCase()}`}>
                            {normalizedStatus(participant.status || 'inactive')}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '18px', color: '#9ca3af' }}>No participants yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div style={{ marginTop: '16px' }}>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </div>
        </div>
        <div className="modal-actions" style={{ padding: '0 30px 25px', justifyContent: 'flex-end', gap: '12px' }}>
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
  );
};

export default Events;
