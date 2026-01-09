import React, { useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Pagination from '../../components/Pagination';

const Reports = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchTerm, setSearchTerm] = useState(() => {
    try {
      return localStorage.getItem('eventsSearchTerm') || '';
    } catch {
      return '';
    }
  });
  const [selectedEvent, setSelectedEvent] = useState(null);

  const allEvents = [
    {
      id: 1,
      title: 'Tech Conference 2026',
      date: '2026-02-15',
      time: '09:00 - 17:00',
      location: 'Manila Convention Center',
      capacity: 500,
      registered: 234,
      status: 'Completed',
      description: 'A full-day technology conference covering AI, cloud, and modern web development.',
      organizerName: 'Tech Events Inc.',
      organizerEmail: 'info@techevents.com',
      staff: ['John Doe', 'Jane Smith', 'Mike Johnson']
    },
    {
      id: 2,
      title: 'Web Development Workshop',
      date: '2026-01-20',
      time: '14:00 - 18:00',
      location: 'BGC Innovation Hub',
      capacity: 100,
      registered: 87,
      status: 'Completed',
      description: 'Hands-on workshop on modern web development frameworks.',
      organizerName: 'Dev Academy',
      organizerEmail: 'workshops@devacademy.com',
      staff: ['Sarah Lee', 'Tom Wilson']
    },
    {
      id: 3,
      title: 'Business Seminar',
      date: '2026-03-10',
      time: '10:00 - 16:00',
      location: 'Makati Business Center',
      capacity: 200,
      registered: 145,
      status: 'Completed',
      description: 'Business growth and entrepreneurship seminar.',
      organizerName: 'Business Hub PH',
      organizerEmail: 'hello@businesshubph.com',
      staff: ['Alex Chen', 'Maria Garcia', 'Robert Kim']
    }
  ];

  // Get attendees from localStorage
  const getEventAttendees = (eventId) => {
    try {
      const raw = localStorage.getItem('myTickets');
      const tickets = raw ? JSON.parse(raw) : [];
      return tickets.filter(t => t.eventId === eventId);
    } catch {
      return [];
    }
  };

  // Filter for completed/past events only
  const pastEvents = allEvents.filter(event => event.status === 'Completed' || new Date(event.date) < new Date());

  const filteredEvents = pastEvents.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentEvents = filteredEvents.slice(startIndex, startIndex + itemsPerPage);

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page on search
    try {
      localStorage.setItem('eventsSearchTerm', value);
    } catch {
      /* ignore storage errors */
    }
  };

  const downloadAttendanceReport = (event) => {
    const attendees = getEventAttendees(event.id);
    const doc = new jsPDF();

    // Title
    doc.setFontSize(16);
    doc.setTextColor(15, 118, 110);
    doc.text(`${event.title} - Attendance Report`, 14, 20);

    // Event Details
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.text(`Date: ${new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 35);
    doc.text(`Time: ${event.time}`, 14, 43);
    doc.text(`Location: ${event.location}`, 14, 51);
    doc.text(`Organizer: ${event.organizerName}`, 14, 59);
    doc.text(`Organizer Email: ${event.organizerEmail}`, 14, 67);
    
    if (event.staff && event.staff.length > 0) {
      doc.text(`Staff: ${event.staff.join(', ')}`, 14, 75);
      doc.text(`Description: ${event.description}`, 14, 83);
    } else {
      doc.text(`Description: ${event.description}`, 14, 75);
    }

    // Attendance Summary
    doc.setFontSize(12);
    doc.setTextColor(15, 118, 110);
    doc.text('Attendance Summary', 14, 100);
    
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text(`Total Capacity: ${event.capacity}`, 14, 108);
    doc.text(`Total Registered: ${event.registered}`, 14, 116);
    doc.text(`Attendance Rate: ${((event.registered / event.capacity) * 100).toFixed(1)}%`, 14, 124);

    // Attendees Table
    doc.setFontSize(12);
    doc.setTextColor(15, 118, 110);
    doc.text('Registered Attendees', 14, 140);

    if (attendees.length > 0) {
      const tableData = attendees.map(attendee => [
        attendee.userName,
        new Date(attendee.registeredAt).toLocaleDateString('en-US'),
        new Date(attendee.registeredAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        attendee.ticketId
      ]);

      doc.autoTable({
        head: [['Name', 'Registration Date', 'Registration Time', 'Ticket ID']],
        body: tableData,
        startY: 147,
        theme: 'striped',
        headerStyles: {
          fillColor: [15, 118, 110],
          textColor: 255,
          fontStyle: 'bold'
        },
        margin: { top: 140 }
      });
    } else {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('No attendees registered yet.', 14, 147);
    }

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated on ${new Date().toLocaleString('en-US')}`, 14, doc.internal.pageSize.height - 10);

    doc.save(`${event.title.replace(/\s+/g, '_')}_Attendance_Report.pdf`);
  };

  return (
    <div className="section">
      <h2>Reports & Analytics</h2>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search events by name or location..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {filteredEvents.length > 0 ? (
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
                {currentEvents.map(event => (
                  <tr key={event.id}>
                    <td>{event.title}</td>
                    <td>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td>{event.time}</td>
                    <td>{event.location}</td>
                    <td>{event.registered} / {event.capacity}</td>
                    <td>
                      <span className={`status-badge ${event.status.toLowerCase()}`}>
                        {event.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => setSelectedEvent(event)}
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '13px', minWidth: '90px' }}
                      >
                        Details
                      </button>
                      <button
                        onClick={() => downloadAttendanceReport(event)}
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '13px', minWidth: '110px' }}
                      >
                        Download PDF
                      </button>
                    </td>
                  </tr>
                ))}
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
      ) : (
        <div className="empty-state">
          <p>No completed events found</p>
        </div>
      )}

      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          attendees={getEventAttendees(selectedEvent.id)}
          onClose={() => setSelectedEvent(null)}
          onDownload={() => downloadAttendanceReport(selectedEvent)}
        />
      )}
    </div>
  );
};

const EventDetailsModal = ({ event, attendees, onClose, onDownload }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAttendees = attendees.filter(a =>
    a.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.email && a.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    a.ticketId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '1250px', width: '96vw' }}
      >
        <div className="modal-header">
          <h2>{event.title}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '10px 20px 20px' }}>
          {/* Left: Event Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {event.description && (
              <div style={{ padding: '14px', backgroundColor: '#f0f9f8', borderLeft: '4px solid #0f766e', borderRadius: '4px' }}>
                <p style={{ margin: 0, color: '#1f2937' }}>{event.description}</p>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#4b5563', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Status</p>
                <span className={`status-badge ${event.status.toLowerCase()}`}>{event.status}</span>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#4b5563', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Capacity</p>
                <p style={{ margin: 0, color: '#1f2937' }}>{event.registered} / {event.capacity}</p>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#4b5563', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Capacity Progress</p>
                <div className="progress-bar" style={{ marginTop: '6px' }}>
                  <div
                    className="progress-fill"
                    style={{ width: `${(event.registered / event.capacity) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#4b5563', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Organizer</p>
                <p style={{ margin: 0, color: '#1f2937' }}>{event.organizerName || '—'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#4b5563', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Email</p>
                <p style={{ margin: 0, color: '#0f766e' }}>{event.organizerEmail || '—'}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#4b5563', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Date</p>
                <p style={{ margin: 0, color: '#1f2937' }}>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#4b5563', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Time</p>
                <p style={{ margin: 0, color: '#1f2937' }}>{event.time}</p>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#4b5563', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Location</p>
                <p style={{ margin: 0, color: '#1f2937' }}>{event.location}</p>
              </div>
            </div>
          </div>

          {/* Right: Participants */}
          <div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search by name, email, or ticket ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flex: 1, minWidth: '240px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
              <button className="btn-secondary" onClick={onDownload} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>📄 PDF</button>
            </div>
            <div className="events-table-container">
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
                  {filteredAttendees.length > 0 ? (
                    filteredAttendees.map(a => (
                      <tr key={a.id}>
                        <td><strong>{a.userName}</strong></td>
                        <td>{a.email || '—'}</td>
                        <td style={{ fontSize: '12px', fontFamily: 'monospace', color: '#0f766e' }}>{a.ticketId}</td>
                        <td>{new Date(a.registeredAt).toLocaleDateString('en-US')}</td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            backgroundColor: '#d1fae5',
                            color: '#065f46'
                          }}>Active</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>No participants found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="modal-actions" style={{ padding: '0 20px 20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
