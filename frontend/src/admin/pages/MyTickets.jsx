import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import Pagination from '../../components/Pagination';

const MyTickets = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Fetch tickets from backend
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        const adminId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
        if (!adminId) {
          throw new Error('User not authenticated');
        }

        const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await fetch(`${base}/events/admin/${adminId}/registrations`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch tickets');
        }

        const registrations = await response.json();
        
        // Transform registrations to ticket format
        const transformedTickets = registrations.map(reg => ({
          id: reg.id,
          ticketId: reg.ticketCode,
          ticketCode: reg.ticketCode,
          eventId: reg.eventId,
          eventTitle: reg.event?.title || 'Event',
          date: reg.event?.date,
          time: reg.event?.time,
          location: reg.event?.location,
          status: reg.status || reg.event?.status || 'inactive',
          eventStatus: reg.event?.status || 'upcoming',
          registeredAt: reg.registeredAt,
          userName: reg.attendeeName,
          qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify({ ticketCode: reg.ticketCode, eventId: reg.eventId, eventTitle: reg.event?.title, userName: reg.attendeeName }))}`,
          description: reg.event?.description,
          organizerName: reg.event?.createdByName,
          organizerEmail: reg.event?.createdByEmail
        }));

        setTickets(transformedTickets);
        setError(null);
      } catch (err) {
        console.error('Error fetching tickets:', err);
        setError(err.message || 'Failed to load tickets');
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

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
    const name = t.userName || `${sessionStorage.getItem('firstName') || ''} ${sessionStorage.getItem('lastName') || ''}`.trim() || t.email || '—';
    const company = t.company || sessionStorage.getItem('companyName') || '—';
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
        <div style="margin-top: 30px;">
          <p style="margin: 0; font-size: 18px; font-weight: 700; color: #1f2937;">${name}</p>
          <p style="margin: 6px 0 0 0; font-size: 14px; color: #666;">${t.email || sessionStorage.getItem('email') || ''}</p>
        </div>
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



  const handleCancelRegistration = async (ticketId) => {
    Swal.fire({
      icon: 'warning',
      title: 'Cancel Registration',
      text: 'Are you sure you want to cancel this registration?',
      confirmButtonText: 'Yes, Cancel',
      confirmButtonColor: '#dc2626',
      showCancelButton: true,
      cancelButtonText: 'No, Keep It'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          
          const response = await fetch(`${base}/events/${ticketId}/cancel`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : ''
            }
          });

          if (!response.ok) {
            throw new Error('Failed to cancel registration');
          }

          // Remove from local state
          const updatedTickets = tickets.filter(t => t.id !== ticketId);
          setTickets(updatedTickets);
          
          // Also remove from localStorage if it exists
          try {
            const raw = localStorage.getItem('myTickets');
            if (raw) {
              const localTickets = JSON.parse(raw);
              const updatedLocal = localTickets.filter(t => t.id !== ticketId);
              localStorage.setItem('myTickets', JSON.stringify(updatedLocal));
            }
          } catch {}

          Swal.fire({
            icon: 'success',
            title: 'Cancelled!',
            text: 'Registration cancelled successfully.',
            confirmButtonText: 'OK',
            confirmButtonColor: '#0f766e'
          });
        } catch (err) {
          console.error('Cancel error:', err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.message || 'Failed to cancel registration. Please try again.',
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
      {error && (
        <div style={{ padding: '10px', marginBottom: '12px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#991b1b' }}>
          {error}
        </div>
      )}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '24px', color: '#555' }}>Loading tickets...</div>
      ) : tickets.length === 0 ? (
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
                {(t.eventStatus || '').toLowerCase() !== 'ongoing' && (
                  <button 
                    className="btn-secondary" 
                    style={{ 
                      background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', 
                      color: 'white'
                    }}
                    onClick={() => handleCancelRegistration(t.id)}
                    title="Cancel registration"
                  >
                    Cancel
                  </button>
                )}
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
                <th>Date</th>
                <th>Time</th>
                <th>Location</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentTickets.length > 0 ? (
                currentTickets.map((t) => (
                  <tr key={t.id}>
                    <td>{t.eventTitle || '—'}</td>
                    <td>{t.ticketId || '—'}</td>
                    <td>{t.date ? new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                    <td>{t.time || '—'}</td>
                    <td>{t.location || '—'}</td>
                    <td><span className={`status-badge ${t.status || 'upcoming'}`}>{t.status || 'upcoming'}</span></td>
                    <td>
                      <button className="btn-secondary" onClick={() => setSelectedTicket(t)} style={{ padding: '5px 10px', fontSize: '12px', marginRight: '5px' }}>Details</button>
                      <button className="btn-secondary" onClick={() => downloadTicket(t)} style={{ padding: '5px 10px', fontSize: '12px', marginRight: '5px' }}>Download</button>
                      {(t.eventStatus || '').toLowerCase() !== 'ongoing' && (
                        <button 
                          className="btn-secondary" 
                          style={{ 
                            background: '#dc2626', 
                            color: 'white', 
                            padding: '5px 10px', 
                            fontSize: '12px'
                          }}
                          onClick={() => handleCancelRegistration(t.id)}
                          title="Cancel registration"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="empty-state" style={{ textAlign: 'center', padding: '40px' }}>No tickets found</td>
                </tr>
              )}
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
      {selectedTicket && <TicketDetailsModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />}
    </div>
  );
};

const TicketDetailsModal = ({ ticket, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header modal-header-row">
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
            {ticket.description && (
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f9f8', borderLeft: '4px solid #0f766e', borderRadius: '4px' }}>
                <p style={{ margin: '0', color: '#333', lineHeight: '1.6' }}>{ticket.description}</p>
              </div>
            )}
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
              {ticket.staff && ticket.staff.length > 0 && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Staff</p>
                  <div style={{ margin: '0', fontSize: '15px', color: '#333' }}>
                    {ticket.staff.map((staffMember, idx) => (
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTickets;
