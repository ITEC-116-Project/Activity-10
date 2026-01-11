import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [eventAttendees, setEventAttendees] = useState({});

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const organizerId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
        if (!organizerId) {
          throw new Error('Organizer not authenticated');
        }

        const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const res = await fetch(`${base}/events/by-creator/${organizerId}`);
        if (!res.ok) throw new Error('Failed to load events');
        const data = await res.json();
        setAllEvents(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        console.error('Load events failed', err);
        setError(err.message || 'Failed to load events');
        setAllEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Get attendees from database
  const getEventAttendees = async (eventId) => {
    if (eventAttendees[eventId]) {
      return eventAttendees[eventId];
    }

    try {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await fetch(`${base}/events/${eventId}/attendees`);
      if (!res.ok) return [];
      const data = await res.json();
      const attendees = Array.isArray(data) ? data : [];
      setEventAttendees(prev => ({ ...prev, [eventId]: attendees }));
      return attendees;
    } catch {
      return [];
    }
  };

  // Show all events regardless of status
  const filteredEvents = allEvents.filter(event =>
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

  const downloadAttendanceReport = async (event) => {
    const attendees = await getEventAttendees(event.id);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    // Header Background
    doc.setFillColor(15, 118, 110);
    doc.rect(0, 0, pageWidth, 45, 'F');

    // Title
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text('ATTENDANCE REPORT', margin, 18);
    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    doc.text(event.title, margin, 28);

    // Event Details Section
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
      { label: 'Time:', value: event.time },
      { label: 'Location:', value: event.location },
      { label: 'Organizer:', value: event.createdByName || event.organizerName || 'N/A' },
      { label: 'Email:', value: event.createdByEmail || event.organizerEmail || 'N/A' },
      { label: 'Description:', value: event.description || 'N/A' }
    ];

    eventDetails.forEach(detail => {
      doc.setFont(undefined, 'bold');
      doc.text(detail.label, margin, yPos);
      doc.setFont(undefined, 'normal');
      doc.text(detail.value, margin + 25, yPos);
      yPos += 6;
    });

    // Attendance Summary Section
    yPos += 5;
    doc.setFillColor(230, 240, 240);
    doc.rect(margin, yPos - 4, pageWidth - (2 * margin), 28, 'F');
    
    doc.setFontSize(11);
    doc.setTextColor(15, 118, 110);
    doc.setFont(undefined, 'bold');
    doc.text('ATTENDANCE SUMMARY', margin + 3, yPos + 2);
    
    yPos += 8;
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.setFont(undefined, 'normal');
    
    const summaryData = [
      { label: 'Total Capacity:', value: event.capacity },
      { label: 'Total Registered:', value: event.registered },
      { label: 'Attendance Rate:', value: `${((event.registered / event.capacity) * 100).toFixed(1)}%` }
    ];

    summaryData.forEach(item => {
      doc.setFont(undefined, 'bold');
      doc.text(item.label, margin + 3, yPos);
      doc.setFont(undefined, 'normal');
      doc.text(String(item.value), pageWidth - margin - 40, yPos);
      yPos += 6;
    });

    // Participants Table
    yPos += 8;
    if (attendees.length > 0) {
      const tableData = attendees.map(attendee => [
        attendee.attendeeName || 'N/A',
        new Date(attendee.registeredAt).toLocaleDateString('en-US'),
        new Date(attendee.registeredAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        attendee.ticketCode ? attendee.ticketCode.substring(0, 20) + '...' : 'N/A',
        (attendee.status || 'inactive').charAt(0).toUpperCase() + (attendee.status || 'inactive').slice(1)
      ]);

      autoTable(doc, {
        head: [['Participant Name', 'Registration Date', 'Time', 'Ticket ID', 'Status']],
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
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'left', fontSize: 8 },
          4: { halign: 'center' }
        },
        margin: { top: yPos, left: margin, right: margin },
        didDrawPage: (data) => {
          // Footer on each page
          const pageSize = doc.internal.pageSize;
          const pageHeight = pageSize.getHeight();
          const pageWidth = pageSize.getWidth();
          
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(`Generated on ${new Date().toLocaleString('en-US')}`, margin, pageHeight - 8);
          doc.text(`Page ${data.pageNumber} of ${data.pageCount}`, pageWidth - margin - 30, pageHeight - 8);
        }
      });
    } else {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('No attendees registered yet.', margin, yPos + 5);
      
      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated on ${new Date().toLocaleString('en-US')}`, margin, doc.internal.pageSize.getHeight() - 8);
    }

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
          <p>No events found</p>
        </div>
      )}

      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          getAttendees={getEventAttendees}
          onClose={() => setSelectedEvent(null)}
          onDownload={() => downloadAttendanceReport(selectedEvent)}
        />
      )}
    </div>
  );
};

const EventDetailsModal = ({ event, getAttendees, onClose, onDownload }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendees = async () => {
      setLoading(true);
      const data = await getAttendees(event.id);
      setAttendees(data);
      setLoading(false);
    };
    fetchAttendees();
  }, [event.id]);

  const filteredAttendees = attendees.filter(a =>
    (a.attendeeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.ticketCode || '').toLowerCase().includes(searchTerm.toLowerCase())
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
                <p style={{ margin: 0, color: '#1f2937' }}>{event.createdByName || event.organizerName || '—'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#4b5563', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Email</p>
                <p style={{ margin: 0, color: '#0f766e' }}>{event.createdByEmail || event.organizerEmail || '—'}</p>
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
                    <th>Ticket ID</th>
                    <th>Registration Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Loading participants...</td>
                    </tr>
                  ) : filteredAttendees.length > 0 ? (
                    filteredAttendees.map(a => (
                      <tr key={a.id}>
                        <td><strong>{a.attendeeName || 'N/A'}</strong></td>
                        <td style={{ fontSize: '12px', fontFamily: 'monospace', color: '#0f766e' }}>{a.ticketCode || 'N/A'}</td>
                        <td>{new Date(a.registeredAt).toLocaleDateString('en-US')}</td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            backgroundColor: a.status === 'active' ? '#d1fae5' : '#fee2e2',
                            color: a.status === 'active' ? '#065f46' : '#991b1b'
                          }}>{(a.status || 'inactive').charAt(0).toUpperCase() + (a.status || 'inactive').slice(1)}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>No participants found</td>
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
