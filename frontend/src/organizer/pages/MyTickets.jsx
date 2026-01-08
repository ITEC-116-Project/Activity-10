import React, { useEffect, useState, useRef } from 'react';
import Swal from 'sweetalert2';
import Pagination from '../../components/Pagination';

const MyTickets = () => {
  const [activeEvent, setActiveEvent] = useState({
    id: 2,
    title: 'Web Development Workshop',
    date: '2026-01-20',
    time: '14:00 - 18:00',
    location: 'BGC Innovation Hub',
    capacity: 100,
    registered: 87,
    status: 'ongoing',
    description: 'Hands-on workshop focusing on React, TypeScript, and Vite best practices.'
  });

  const [participants, setParticipants] = useState(() => {
    try {
      const raw = localStorage.getItem('myTickets');
      const tickets = raw ? JSON.parse(raw) : [];
      return tickets.filter(t => t.eventId === activeEvent.id);
    } catch {
      return [];
    }
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [checkedInParticipants, setCheckedInParticipants] = useState(new Set());
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const itemsPerPage = 10;

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(err => console.error('Play error:', err));
        setCameraActive(true);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Camera Error',
        text: 'Could not access camera. Please check permissions.',
        confirmButtonColor: '#0f766e'
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      Swal.fire({
        icon: 'success',
        title: 'QR Captured!',
        text: 'Frame captured. QR processing would happen here.',
        confirmButtonColor: '#0f766e'
      });
    }
  };

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
    const { jsPDF } = window;
    if (!jsPDF) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'PDF library not loaded',
        confirmButtonColor: '#0f766e'
      });
      return;
    }

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFontSize(16);
    doc.setTextColor(15, 118, 110);
    doc.text(`${activeEvent.title} - Attendee List`, 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    const eventDate = new Date(activeEvent.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Date: ${eventDate}`, 14, 28);
    doc.text(`Location: ${activeEvent.location}`, 14, 35);
    doc.text(`Total Attendees: ${participants.length}`, 14, 42);

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

    doc.save(`${activeEvent.title.replace(/\s+/g, '_')}_attendees.pdf`);
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2>Active Event - On-Site Check-In</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '30px' }}>
        {/* Left: Event Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ margin: '0 0 15px 0', color: '#0f766e', fontSize: '24px' }}>{activeEvent.title}</h3>
            {activeEvent.description && (
              <div style={{ padding: '15px', backgroundColor: '#f0f9f8', borderLeft: '4px solid #0f766e', borderRadius: '4px' }}>
                <p style={{ margin: '0', color: '#333', lineHeight: '1.6' }}>{activeEvent.description}</p>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</p>
              <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#333' }}><span className={`status-badge ${activeEvent.status}`}>{activeEvent.status}</span></p>
            </div>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Capacity</p>
              <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#333' }}>{activeEvent.registered} / {activeEvent.capacity}</p>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Capacity Progress</p>
              <div className="progress-bar" style={{ marginTop: '8px' }}>
                <div
                  className="progress-fill"
                  style={{ width: `${(activeEvent.registered / activeEvent.capacity) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</p>
              <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#333' }}>{new Date(activeEvent.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time</p>
              <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#333' }}>{activeEvent.time}</p>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location</p>
              <p style={{ margin: '0', fontSize: '15px', color: '#333' }}>{activeEvent.location}</p>
            </div>
          </div>
        </div>

        {/* Right: Camera Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{
            border: '3px solid #0f766e',
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: '#000',
            aspectRatio: '1',
            maxHeight: '320px'
          }}>
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#1a1a1a',
                color: '#888'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>📷</div>
                <p style={{ margin: '0', textAlign: 'center' }}>Camera feed will appear here</p>
              </div>
            )}
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }} width={320} height={320} />
          
          {cameraActive && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-secondary" onClick={captureFrame} style={{ flex: 1, padding: '8px', fontSize: '13px' }}>
                📸 Capture
              </button>
              <button className="btn-secondary" onClick={stopCamera} style={{ flex: 1, padding: '8px', fontSize: '13px' }}>
                Stop
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Participants Table */}
      <div>
        <h3 style={{ marginBottom: '15px', color: '#0f766e' }}>Participants List</h3>
        
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
            onClick={exportPDF}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            📄 PDF
          </button>
        </div>

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
      </div>
    </div>
  );
};

export default MyTickets;
