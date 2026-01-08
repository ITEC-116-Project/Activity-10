import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import Pagination from '../../components/Pagination';

const MyTickets = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [tickets, setTickets] = useState(() => {
    try {
      const raw = localStorage.getItem('myTickets');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'

  const itemsPerPage = viewMode === 'card' ? 5 : 10;
  const totalPages = Math.ceil(tickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTickets = tickets.slice(startIndex, startIndex + itemsPerPage);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setCurrentPage(1);
  };

  const downloadTicket = async (t) => {
    const title = t.eventTitle || 'Event';
    const ticketId = t.ticketId || 'N/A';
    const name = t.userName || '—';
    const company = t.company || '—';
    const qr = t.qrCode || '';
    const element = document.createElement('div');
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.innerHTML = `<div style="width: 500px; padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #d4f1e8 0%, #e8f9f5 100%); display: flex; flex-direction: column;">
      <div style="background: white; border-radius: 20px; padding: 40px 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
        <p style="margin: 0 0 6px 0; font-size: 13px; color: #888; letter-spacing: 0.5px; text-transform: uppercase;">Event Name</p>
        <p style="margin: 0 0 20px 0; font-size: 22px; font-weight: 700; color: #0f766e;">${title}</p>
        <p style="margin: 0 0 6px 0; font-size: 13px; color: #888; letter-spacing: 0.5px; text-transform: uppercase;">Ticket ID</p>
        <p style="margin: 0 0 30px 0; font-size: 14px; color: #666;">${ticketId}</p>
        <div style="display: flex; justify-content: center; margin: 30px 0;">
          ${qr ? `<img src="${qr}" alt="Ticket QR" style="width: 280px; height: 280px; border: 4px solid #e5e7eb; border-radius: 16px;" />` : '<p>No QR available</p>'}
        </div>
        <p style="margin: 30px 0 8px 0; font-size: 13px; color: #888; letter-spacing: 0.5px; text-transform: uppercase;">Attendee Name</p>
        <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #1f2937;">${name}</p>
        <p style="margin: 0 0 8px 0; font-size: 13px; color: #888; letter-spacing: 0.5px; text-transform: uppercase;">Company Name</p>
        <p style="margin: 0; font-size: 14px; color: #666;">${company}</p>
      </div>
    </div>`;
    document.body.appendChild(element);
    try {
      const imgEl = element.querySelector('img');
      if (imgEl) {
        await new Promise((resolve) => {
          if (imgEl.complete) {
            resolve();
          } else {
            imgEl.onload = resolve;
            imgEl.onerror = resolve;
          }
        });
      }
      const canvas = await html2canvas(element, { backgroundColor: '#d4f1e8', scale: 2, useCORS: true, allowTaint: true });
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${ticketId.replace(/\//g, '-')}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        document.body.removeChild(element);
      });
    } catch (err) {
      console.error('Error generating image:', err);
      document.body.removeChild(element);
    }
  };

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'myTickets') {
        try {
          const parsed = e.newValue ? JSON.parse(e.newValue) : [];
          setTickets(Array.isArray(parsed) ? parsed : []);
        } catch {
          setTickets([]);
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleCancelRegistration = (ticketId) => {
    Swal.fire({
      icon: 'warning',
      title: 'Cancel Registration',
      text: 'Are you sure you want to cancel this registration?',
      confirmButtonText: 'Yes, Cancel',
      confirmButtonColor: '#dc2626',
      showCancelButton: true,
      cancelButtonText: 'No, Keep It'
    }).then((result) => {
      if (result.isConfirmed) {
        try {
          const updatedTickets = tickets.filter(t => t.id !== ticketId);
          localStorage.setItem('myTickets', JSON.stringify(updatedTickets));
          setTickets(updatedTickets);
          Swal.fire({
            icon: 'success',
            title: 'Cancelled!',
            text: 'Registration cancelled successfully.',
            confirmButtonText: 'OK',
            confirmButtonColor: '#0f766e'
          });
        } catch (err) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to cancel registration. Please try again.',
            confirmButtonText: 'OK',
            confirmButtonColor: '#dc2626'
          });
        }
      }
    });
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2>My Tickets</h2>
        <select value={viewMode} onChange={(e) => handleViewModeChange(e.target.value)} className="view-mode-select">
          <option value="card">⊞ Cards</option>
          <option value="table">≡ Table</option>
        </select>
      </div>
      {tickets.length === 0 ? (
        <div className="empty-state">
          <p>No tickets yet. Register to an event to see it here.</p>
        </div>
      ) : viewMode === 'card' ? (
        <>
        <div className="events-grid">
          {currentTickets.map((t) => (
            <div key={t.id} className="event-card">
              <div className="event-header">
                <h4>{t.eventTitle || 'Registered Event'}</h4>
                <span className={`status-badge ${t.status || 'upcoming'}`}>{t.status || 'upcoming'}</span>
              </div>
              {t.qrCode && (
                <div style={{ textAlign: 'center', padding: '15px 0', borderBottom: '1px solid #eee' }}>
                  <img src={t.qrCode} alt="Ticket QR Code" style={{ width: '150px', height: '150px', border: '2px solid #ddd', borderRadius: '8px' }} />
                </div>
              )}
              <div className="event-details">
                <p><strong>Ticket ID:</strong> {t.ticketId || '—'}</p>
                <p><strong>Date:</strong> {t.date ? new Date(t.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</p>
                <p><strong>Time:</strong> {t.time || '—'}</p>
                <p><strong>Location:</strong> {t.location || '—'}</p>
              </div>
              <div className="event-actions">
                <button className="btn-secondary" onClick={() => setSelectedTicket(t)}>Details</button>
                <button className="btn-secondary" onClick={() => downloadTicket(t)}>Download</button>
                <button 
                  className="btn-secondary" 
                  style={{ background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', color: 'white' }}
                  onClick={() => handleCancelRegistration(t.id)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
        {tickets.length > itemsPerPage && (
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
                <th>Ticket ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentTickets.map((t) => (
                <tr key={t.id}>
                  <td>{t.eventTitle || '—'}</td>
                  <td>{t.ticketId || '—'}</td>
                  <td>{t.userName || '—'}</td>
                  <td>{t.email || '—'}</td>
                  <td>{t.date ? new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                  <td>{t.time || '—'}</td>
                  <td><span className={`status-badge ${t.status || 'upcoming'}`}>{t.status || 'upcoming'}</span></td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn-secondary" onClick={() => setSelectedTicket(t)} style={{ padding: '5px 10px', fontSize: '12px', marginRight: '5px' }}>Details</button>
                    <button className="btn-secondary" onClick={() => downloadTicket(t)} style={{ padding: '5px 10px', fontSize: '12px', marginRight: '5px' }}>Download</button>
                    <button 
                      className="btn-secondary" 
                      style={{ background: '#dc2626', color: 'white', padding: '5px 10px', fontSize: '12px' }}
                      onClick={() => handleCancelRegistration(t.id)}
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tickets.length > itemsPerPage && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
        </>
      )}
      {selectedTicket && (
        <TicketDetailsModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
      )}
    </div>
  );
};

const TicketDetailsModal = ({ ticket, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{ticket.eventTitle}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div style={{ padding: '20px 30px 30px 30px' }}>
          {ticket.qrCode && (
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <img src={ticket.qrCode} alt="Ticket QR Code" style={{ width: '200px', height: '200px', border: '2px solid #ddd', borderRadius: '8px' }} />
            </div>
          )}
          <div className="event-details">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ticket ID</p>
                <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#333' }}>{ticket.ticketId || '—'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</p>
                <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#333' }}><span className={`status-badge ${ticket.status || 'upcoming'}`}>{ticket.status || 'upcoming'}</span></p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Organizer</p>
                <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#333' }}>{ticket.organizerName || ticket.organizer || '—'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Organizer Email</p>
                <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#0f766e' }}>{ticket.organizerEmail || ticket.organizer_email || '—'}</p>
              </div>
              {/* {ticket.staff && ticket.staff.length > 0 && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Staff</p>
                  <div style={{ margin: '0', fontSize: '15px', color: '#333' }}>
                    {ticket.staff.map((staffMember, idx) => (
                      <p key={idx} style={{ margin: '4px 0', paddingLeft: '8px', borderLeft: '2px solid #d1fae5' }}>{staffMember}</p>
                    ))}
                  </div>
                </div>
              )} */}
            </div>
            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Attendee Name</p>
                <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#333' }}>{ticket.userName || '—'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</p>
                <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#333' }}>{ticket.email || '—'}</p>
              </div>
              {ticket.company && (
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Company</p>
                  <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#333' }}>{ticket.company}</p>
                </div>
              )}
            </div>
            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</p>
                <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#333' }}>{ticket.date ? new Date(ticket.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time</p>
                <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#333' }}>{ticket.time || '—'}</p>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location</p>
                <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#333' }}>{ticket.location || '—'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Registered</p>
                <p style={{ margin: '0', fontSize: '15px', color: '#333' }}>{ticket.registeredAt ? new Date(ticket.registeredAt).toLocaleString('en-US') : '—'}</p>
              </div>
            </div>
          </div>
          <div className="modal-actions" style={{ marginTop: '20px' }}>
            <button className="btn-secondary" onClick={onClose}>Close</button>
            <button className="btn-primary" onClick={() => window.open(ticket.qrCode, '_blank')}>Download QR Code</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTickets;
