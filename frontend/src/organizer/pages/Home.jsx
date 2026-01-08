import React, { useState, useEffect } from 'react';
import { MdEvent, MdPeople, MdStars, MdFileDownload, MdSearch } from 'react-icons/md';
import Swal from 'sweetalert2';
import Pagination from '../../components/Pagination';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Home = ({ onRedirectToEdit }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState('card');
  const [organizerEvents, setOrganizerEvents] = useState([
    {
      id: 101,
      title: 'Web Development Workshop',
      date: '2026-01-20',
      time: '14:00 - 18:00',
      location: 'BGC Innovation Hub',
      capacity: 100,
      registered: 87,
      status: 'ongoing',
      description: 'Hands-on workshop focusing on React, TypeScript, and Vite best practices.',
      createdBy: localStorage.getItem('userId') || '1',
      createdByName: localStorage.getItem('firstName') || 'Organizer'
    },
    {
      id: 102,
      title: 'Tech Conference 2026',
      date: '2026-02-15',
      time: '09:00 - 17:00',
      location: 'Manila Convention Center',
      capacity: 500,
      registered: 234,
      status: 'upcoming',
      description: 'A full-day technology conference covering AI, cloud, and modern web development.',
      createdBy: localStorage.getItem('userId') || '1',
      createdByName: localStorage.getItem('firstName') || 'Organizer'
    },
    {
      id: 103,
      title: 'Business Seminar',
      date: '2026-03-10',
      time: '10:00 - 16:00',
      location: 'Makati Business Center',
      capacity: 200,
      registered: 145,
      status: 'upcoming',
      description: 'Executive seminar on scaling operations, finance strategies, and leadership.',
      createdBy: localStorage.getItem('userId') || '1',
      createdByName: localStorage.getItem('firstName') || 'Organizer'
    }
  ]);

  const filteredEvents = organizerEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' ? true : event.status === filterStatus;
    return matchesSearch && matchesFilter;
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
      <h2>My Events Dashboard</h2>

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
                  <p><strong>Attendees:</strong> {event.registered} / {event.capacity}</p>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${(event.registered / event.capacity) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="event-actions">
                  <button className="btn-secondary" onClick={() => setSelectedEvent(event)}>Participants</button>
                  <button className="btn-secondary" onClick={() => onRedirectToEdit(event)}>Edit</button>
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
                    <td><span className={`status-badge ${event.status}`}>{event.status}</span></td>
                    <td style={{ textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button className="btn-secondary" onClick={() => setSelectedEvent(event)} style={{ padding: '6px 12px', fontSize: '13px' }}>Participants</button>
                      <button className="btn-secondary" onClick={() => onRedirectToEdit(event)} style={{ padding: '6px 12px', fontSize: '13px' }}>Edit</button>
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

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Ticket ID', 'Registration Date', 'Check-in Status'];
    const rows = participants.map(p => [
      p.userName,
      p.email || 'N/A',
      p.ticketId,
      new Date(p.registeredAt).toLocaleDateString('en-US'),
      checkedInParticipants.has(p.id) ? 'Checked In' : 'Pending'
    ]);

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}_attendees.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              onClick={exportCSV}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <MdFileDownload /> CSV
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

export default Home;
