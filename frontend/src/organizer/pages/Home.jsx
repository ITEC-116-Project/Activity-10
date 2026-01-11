import React, { useState, useEffect } from 'react';
import { MdEvent, MdPeople, MdStars, MdFileDownload, MdSearch } from 'react-icons/md';
import Swal from 'sweetalert2';
import CreateEventModal from '../components/CreateEventModal';
import Pagination from '../../components/Pagination';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { deriveStatusKey, displayStatusLabel } from '../../shared/utils/eventStatus';

const Home = ({ onRedirectToEdit, onViewActiveEvent, onCreateEvent, redirectToEventsOnEdit = false }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState('card');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [organizerEvents, setOrganizerEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventsError, setEventsError] = useState(null);
  // Read userId from sessionStorage first (LoginPage stores it there), fallback to localStorage
  const currentUserId = sessionStorage.getItem('userId') || localStorage.getItem('userId');

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const load = () => {
      setLoadingEvents(true);
      // Fetch all events so Home shows every created event; Edit button is hidden for events not owned by current user
      fetch(`${base}/events`)
        .then(async (res) => {
          setLoadingEvents(false);
          if (!res.ok) throw new Error(await res.text());
          return res.json();
        })
        .then((data) => {
          setOrganizerEvents(Array.isArray(data) ? data : []);
        })
        .catch((err) => {
          console.error('Failed to load events', err);
          setEventsError(err.message || 'Failed to load events');
          setLoadingEvents(false);
        });
    };

    load();
    const poll = setInterval(load, 60_000); // refresh every 60s to update statuses automatically
    return () => clearInterval(poll);
  }, []);

    useEffect(() => {
      const handler = (e) => {
        const created = e.detail;
        if (!created) return;
        setOrganizerEvents(prev => {
          if (prev.some(ev => String(ev.id) === String(created.id))) return prev;
          return [created, ...prev];
        });
      };
      window.addEventListener('event:created', handler);
      return () => window.removeEventListener('event:created', handler);
    }, []);

  const filteredEvents = organizerEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' ? true : deriveStatusKey(event) === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Prioritize ongoing events to appear first (cards and table)
  const statusRank = (s) => (s === 'ongoing' ? 0 : s === 'upcoming' ? 1 : (s === 'past' || s === 'completed') ? 2 : 3);
  const prioritizedEvents = filteredEvents.slice().sort((a, b) => statusRank(deriveStatusKey(a)) - statusRank(deriveStatusKey(b)));

  const itemsPerPage = viewMode === 'card' ? 5 : 10;
  const totalPages = Math.ceil(prioritizedEvents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentEvents = prioritizedEvents.slice(startIndex, startIndex + itemsPerPage);

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
      <h2>My Events Dashboard</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <MdEvent className="stat-icon" />
          <div className="stat-info">
            <h3>Total Events</h3>
            <p className="stat-value">{filteredEvents.length}</p>
          </div>
        </div>

        {loadingEvents && (
          <div style={{ padding: '10px 0', color: '#666' }}>Loading your events...</div>
        )}
        {eventsError && (
          <div style={{ padding: '10px 0', color: '#b91c1c' }}>Error loading events: {eventsError}</div>
        )}
        <div className="stat-card">
          <MdPeople className="stat-icon" />
          <div className="stat-info">
            <h3>Total Attendees</h3>
            <p className="stat-value">{filteredEvents.reduce((sum, e) => sum + e.registered, 0)}</p>
          </div>
        </div>
        <div className="stat-card">
          <MdStars className="stat-icon" />
          <div className="stat-info">
            <h3>Avg. Capacity</h3>
            <p className="stat-value">
              {filteredEvents.length > 0 
                ? Math.round(filteredEvents.reduce((sum, e) => sum + (e.registered / e.capacity * 100), 0) / filteredEvents.length)
                : 0}%
            </p>
          </div>
        </div>
      </div>

      <div className="events-section">
        <h3>Your Created Events</h3>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search your events by name or location..."
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

        {/* Create Event button - appears above cards and table */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', margin: '14px 0' }}>
          <button
            className="btn-primary"
            onClick={() => {
              if (onCreateEvent) {
                onCreateEvent();
                return;
              }
              setCreateOpen(true);
            }}
            style={{ padding: '8px 14px', fontWeight: 600 }}
          >
            + Create Event
          </button>
        </div>

        {viewMode === 'card' ? (
        <>
        <div className="events-grid">
          {currentEvents.length > 0 ? (
            currentEvents.map(event => (
              <div key={event.id} className="event-card">
                <div className="event-header">
                  <h4>{event.title}</h4>
                  <span className={`status-badge ${deriveStatusKey(event)}`}>{displayStatusLabel(event)}</span>
                </div>
                <div className="event-details">
                  <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p><strong>Time:</strong> {event.time}</p>
                  <p><strong>Location:</strong> {event.location}</p>
                  <p><strong>Attendees:</strong> {event.registered} / {event.capacity}</p>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${(event.registered / event.capacity) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="event-actions">
                  {deriveStatusKey(event) === 'ongoing' ? (
                    <button className="btn-primary" onClick={() => onViewActiveEvent && onViewActiveEvent(event)}>View</button>
                  ) : (
                    <>
                      <button className="btn-secondary" onClick={() => setSelectedEvent(event)}>Participants</button>
                      {String(event.createdBy) === String(currentUserId) && (
                        <button className="btn-secondary" onClick={() => {
                          // prefer inline edit modal; fallback to redirect callback if explicitly provided
                          if (redirectToEventsOnEdit && typeof onRedirectToEdit === 'function') {
                            onRedirectToEdit(event);
                          } else if (typeof onRedirectToEdit === 'function' && (typeof window !== 'undefined' && window.forceRedirectOnEdit)) {
                            onRedirectToEdit(event);
                          } else {
                            setEditEvent(event);
                            setEditOpen(true);
                          }
                        }}>Edit</button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>No events found. Create your first event in the Events section!</p>
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
                <th>Attendees</th>
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
                    <td><span className={`status-badge ${deriveStatusKey(event)}`}>{displayStatusLabel(event)}</span></td>
                    <td style={{ textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      {deriveStatusKey(event) === 'ongoing' ? (
                        <button className="btn-primary" onClick={() => onViewActiveEvent && onViewActiveEvent(event)} style={{ padding: '6px 12px', fontSize: '13px' }}>View</button>
                      ) : (
                        <>
                              <button className="btn-secondary" onClick={() => setSelectedEvent(event)} style={{ padding: '6px 12px', fontSize: '13px' }}>Participants</button>
                              {String(event.createdBy) === String(currentUserId) && (
                                <button className="btn-secondary" onClick={() => {
                                  if (redirectToEventsOnEdit && typeof onRedirectToEdit === 'function') {
                                    onRedirectToEdit(event);
                                  } else if (typeof onRedirectToEdit === 'function' && (typeof window !== 'undefined' && window.forceRedirectOnEdit)) {
                                    onRedirectToEdit(event);
                                  } else {
                                    setEditEvent(event);
                                    setEditOpen(true);
                                  }
                                }} style={{ padding: '6px 12px', fontSize: '13px' }}>Edit</button>
                              )}
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>No events found</td>
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
          <ParticipantsModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
        )}
        {createOpen && (
          <CreateEventModal
            onClose={() => setCreateOpen(false)}
            onCreate={(newEvent) => {
              setOrganizerEvents(prev => [newEvent, ...prev]);
              setCreateOpen(false);
              Swal.fire({ icon: 'success', title: 'Event Created', text: 'Your event was created.', confirmButtonColor: '#0f766e' });
            }}
          />
        )}
        {editOpen && editEvent && (
          <EditEventModal
            event={editEvent}
            onClose={() => { setEditOpen(false); setEditEvent(null); }}
            onSave={(updated) => {
              setOrganizerEvents(prev => prev.map(ev => String(ev.id) === String(updated.id) ? updated : ev));
              setEditOpen(false);
              setEditEvent(null);
              // notify other pages
              try { window.dispatchEvent(new CustomEvent('event:updated', { detail: updated })); } catch {}
            }}
          />
        )}
      </div>
    </div>
  );
};

// CreateEventModal moved to organizer/components/CreateEventModal.jsx

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
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Title
    doc.setFontSize(16);
    doc.setTextColor(15, 118, 110);
    doc.text(`${event.title} - Attendee List`, 14, 20);

    // Event Details
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    const eventDate = new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Date: ${eventDate}`, 14, 28);
    doc.text(`Location: ${event.location}`, 14, 35);
    doc.text(`Total Attendees: ${participants.length}`, 14, 42);

    // Table
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

// Inline edit modal for Home page
const EditEventModal = ({ event, onClose, onSave }) => {
  // parse initial date and 12-hour time components similar to EventsEditModal
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
  const pad = (v) => String(v).padStart(2,'0');
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

  useEffect(() => {
    // Prevent opening edit modal for events not owned by the current user
    const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
    if (String(event.createdBy) !== String(userId)) {
      Swal.fire({ icon: 'warning', title: 'Unauthorized', text: 'You are not allowed to edit this event.', confirmButtonColor: '#0f766e' });
      onClose && onClose();
    }
  }, [event, onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Ensure only the event owner can submit edits
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
  const minDate = todayLocalISO();
    // allow saving unchanged past events, but disallow changing the start date to a past date
    const origDate = event?.date ? toLocalISO(event.date) : null;
    if (new Date(startDate) < new Date(minDate) && startDate !== origDate) {
      Swal.fire({ icon: 'warning', title: 'Invalid start date', text: 'Start date cannot be in the past.', confirmButtonColor: '#0f766e' });
      return;
    }
    // prevent setting a start time in the past for today's date unless it's the original unchanged start
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

    // prevent setting an end time in the past for today's date unless it's the original unchanged end
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
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px' }}>
        <div className="modal-header">
          <h2>Edit Event</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px 30px' }}>
          <div style={{ display: 'grid', gap: '12px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: 600, color: '#111' }}>
              Title
              <input style={{ padding: '10px' }} value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: 600, color: '#111' }}>
                  Start Date
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
                  }} required style={{ padding: '10px' }} />
                </label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
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
                  }} style={{ padding: '8px' }}>
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
                  <select value={startMinute} onChange={(e) => setStartMinute(e.target.value)} style={{ padding: '8px' }}>
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
                  }} style={{ padding: '8px' }}>
                    <option>AM</option>
                    <option>PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: 600, color: '#111' }}>
                  End Date
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
                  }} required style={{ padding: '10px' }} />
                </label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <select value={endHour} onChange={(e) => setEndHour(e.target.value)} style={{ padding: '8px' }}>
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
                  <select value={endMinute} onChange={(e) => setEndMinute(e.target.value)} style={{ padding: '8px' }}>
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
                  <select value={endAMPM} onChange={(e) => setEndAMPM(e.target.value)} style={{ padding: '8px' }}>
                    <option>AM</option>
                    <option>PM</option>
                  </select>
                </div>
              </div>
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: 600, color: '#111' }}>
              Location
              <input style={{ padding: '10px' }} value={location} onChange={(e) => setLocation(e.target.value)} required />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: 600, color: '#111' }}>
              Capacity
              <input type="number" min="0" style={{ padding: '10px' }} value={capacity} onChange={(e) => setCapacity(e.target.value)} required />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: 600 }}>
              Description
              <textarea rows="4" style={{ padding: '10px' }} value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Home;
