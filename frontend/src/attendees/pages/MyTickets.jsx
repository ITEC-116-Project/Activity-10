import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import Pagination from '../../components/Pagination';

const MyTickets = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
  const [userMeta, setUserMeta] = useState({ userId: null, role: null });

  // Fetch registrations from backend on mount
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        const token = sessionStorage.getItem('token');
        if (!token) {
          setTickets([]);
          return;
        }

        // Get current user info
        const validateResponse = await fetch('http://localhost:3000/account-login/validate', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!validateResponse.ok) throw new Error('Failed to validate user');
        
        const { userId, role } = await validateResponse.json();
        setUserMeta({ userId, role });

        // Fetch event registrations
        const registrationsResponse = await fetch(`http://localhost:3000/events/attendee/${userId}/registrations`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!registrationsResponse.ok) throw new Error('Failed to fetch registrations');
        
        const registrations = await registrationsResponse.json();

        // Fetch events to get event details
        const eventsResponse = await fetch('http://localhost:3000/events');
        if (!eventsResponse.ok) throw new Error('Failed to fetch events');
        const events = await eventsResponse.json();

        // Combine registration and event data
        const ticketsWithQR = registrations.map(reg => {
          const event = events.find(e => e.id === reg.eventId);
          const qrData = JSON.stringify({
            ticketCode: reg.ticketCode,
            eventId: reg.eventId,
            eventTitle: event?.title || 'Event',
            organizerName: event?.createdByName || 'Organizer',
            attendeeName: reg.attendeeName || `${sessionStorage.getItem('firstName') || ''} ${sessionStorage.getItem('lastName') || ''}`.trim() || '',
            attendeeEmail: sessionStorage.getItem('email') || '',
            registeredAt: reg.registeredAt
          });
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;

          return {
            id: reg.id,
            ticketId: reg.ticketCode,
            ticketCode: reg.ticketCode,
            eventId: reg.eventId,
            eventTitle: event?.title || 'Event',
            date: event?.date || '',
            time: event?.time || '',
            location: event?.location || '',
            status: event?.status || 'upcoming',
            eventStatus: event?.status || 'upcoming',
            registeredAt: reg.registeredAt,
            organizerName: `${event?.createdByFirstName || ''} ${event?.createdByLastName || ''}`.trim() || event?.createdByName || 'Organizer',
            organizerEmail: event?.createdByEmail || 'organizer@email.com',
            qrCode: qrUrl
          };
        });

        setTickets(ticketsWithQR);
      } catch (err) {
        console.error('Error fetching tickets:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load your tickets',
          confirmButtonText: 'OK',
          confirmButtonColor: '#0f766e'
        });
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
        // also send the generated PNG to the user's email
        try {
          const token = sessionStorage.getItem('token');
          if (token) {
            const form = new FormData();
            form.append('file', blob, `${ticketId.replace(/\//g, '-')}.png`);
            const res = fetch(`http://localhost:3000/events/${t.id}/send-ticket`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`
              },
              body: form
            }).then(async (r) => {
              if (!r.ok) {
                const txt = await r.text();
                throw new Error(txt || 'Failed to send ticket');
              }
              Swal.fire({ icon: 'success', title: 'Sent', text: 'Ticket sent to your email.', confirmButtonColor: '#0f766e' });
            }).catch(err => {
              console.error('Failed to send ticket by email', err);
              Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to send ticket to your email', confirmButtonColor: '#ef4444' });
            });
          }
        } catch (err) {
          console.error('Error sending ticket', err);
        }
      });
    } catch (err) {
      console.error('Error generating image:', err);
      document.body.removeChild(element);
    }
  };

  const handleCancelRegistration = (ticketId) => {
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
          const token = sessionStorage.getItem('token');
          if (!token) {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'You must be logged in to cancel registration',
              confirmButtonText: 'OK',
              confirmButtonColor: '#dc2626'
            });
            return;
          }

          // Call backend to delete registration
          const response = await fetch(`http://localhost:3000/events/${ticketId}/cancel`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to cancel registration');
          }

          // Remove from local state
          const updatedTickets = tickets.filter(t => t.id !== ticketId);
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
      
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', fontSize: '16px', color: '#666' }}>
          <p>Loading your tickets...</p>
        </div>
      )}

      {!loading && tickets.length === 0 && (
        <div className="empty-state">
          <p>No tickets yet. Register to an event to see it here.</p>
        </div>
      )}

      {!loading && tickets.length > 0 && (viewMode === 'card' ? (
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
                  style={{ 
                    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', 
                    color: 'white',
                    opacity: (t.eventStatus || '').toLowerCase() === 'ongoing' ? 0.7 : 1,
                    cursor: (t.eventStatus || '').toLowerCase() === 'ongoing' ? 'not-allowed' : 'pointer'
                  }}
                  onClick={() => handleCancelRegistration(t.id)}
                  disabled={(t.eventStatus || '').toLowerCase() === 'ongoing'}
                  title={(t.eventStatus || '').toLowerCase() === 'ongoing' ? 'Cannot cancel ongoing events' : 'Cancel registration'}
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
                <th>Organizer Name</th>
                <th>Organizer Email</th>
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
                  <td>{t.organizerName || '—'}</td>
                  <td>{t.organizerEmail || '—'}</td>
                  <td>{t.date ? new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                  <td>{t.time || '—'}</td>
                  <td><span className={`status-badge ${t.status || 'upcoming'}`}>{t.status || 'upcoming'}</span></td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn-secondary" onClick={() => setSelectedTicket(t)} style={{ padding: '5px 10px', fontSize: '12px', marginRight: '5px' }}>Details</button>
                    <button className="btn-secondary" onClick={() => downloadTicket(t)} style={{ padding: '5px 10px', fontSize: '12px', marginRight: '5px' }}>Download</button>
                    <button 
                      className="btn-secondary" 
                      style={{ 
                        background: '#dc2626', 
                        color: 'white', 
                        padding: '5px 10px', 
                        fontSize: '12px',
                        opacity: (t.eventStatus || '').toLowerCase() === 'ongoing' ? 0.7 : 1,
                        cursor: (t.eventStatus || '').toLowerCase() === 'ongoing' ? 'not-allowed' : 'pointer'
                      }}
                      onClick={() => handleCancelRegistration(t.id)}
                      disabled={(t.eventStatus || '').toLowerCase() === 'ongoing'}
                      title={(t.eventStatus || '').toLowerCase() === 'ongoing' ? 'Cannot cancel ongoing events' : 'Cancel registration'}
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
      ))}
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>

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
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTickets;
