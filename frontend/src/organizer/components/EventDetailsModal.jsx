import React, { useEffect, useMemo, useState } from 'react';
import { MdFileDownload } from 'react-icons/md';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { deriveStatusKey, displayStatusLabel } from '../../shared/utils/eventStatus';
import Pagination from '../../components/Pagination';

const PARTICIPANTS_PER_PAGE = 5;

const EventDetailsModal = ({ event, computedStatus, onClose }) => {
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;

    const fetchParticipants = async () => {
      try {
        setLoadingParticipants(true);
        const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await fetch(`${base}/events/${event.id}/attendees`);
        if (!response.ok) {
          throw new Error('Failed to load participants');
        }
        const data = await response.json();
        if (!cancelled) {
          setParticipants(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to load participants', err);
        if (!cancelled) {
          setParticipants([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingParticipants(false);
        }
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
    const label = value.charAt(0).toUpperCase() + value.slice(1);
    return label;
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

  const totalPages = Math.ceil(filteredParticipants.length / PARTICIPANTS_PER_PAGE);
  const currentPage = totalPages ? Math.min(page, totalPages) : 1;
  const paginatedParticipants = filteredParticipants.slice(
    (currentPage - 1) * PARTICIPANTS_PER_PAGE,
    currentPage * PARTICIPANTS_PER_PAGE
  );

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    doc.setFillColor(15, 118, 110);
    doc.rect(0, 0, pageWidth, 45, 'F');

    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text('ATTENDANCE REPORT', margin, 18);
    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    doc.text(event.title, margin, 28);

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
      { label: 'Status:', value: computedStatus || displayStatusLabel(event) },
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

    doc.save(`${event.title.replace(/\s+/g, '_')}_Attendance_Report.pdf`);
  };

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
                <p style={{ margin: '0', color: '#333', lineHeight: '1.6' }}>{event.description}</p>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</p>
                <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#333' }}>
                  <span className={`status-badge ${deriveStatusKey(event)}`}>{computedStatus || displayStatusLabel(event)}</span>
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Capacity</p>
                <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#333' }}>{event.registered} / {event.capacity}</p>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Capacity Progress</p>
                <div className="progress-bar" style={{ marginTop: '8px' }}>
                  <div className="progress-fill" style={{ width: `${(event.registered / Math.max(event.capacity || 1, 1)) * 100}%` }}></div>
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
        <div className="modal-actions" style={{ padding: '0 30px 25px', justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;
