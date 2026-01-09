import React, { useEffect, useState, useRef } from 'react';
import Swal from 'sweetalert2';
import Pagination from '../../components/Pagination';

// Add jsQR library dynamically
const loadJsQR = () => {
  return new Promise(resolve => {
    if (window.jsQR) {
      resolve();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
      script.onload = () => resolve();
      document.head.appendChild(script);
    }
  });
};

const MyTickets = () => {
  // Static attendee data for valid QR codes
  const validAttendees = [
    {
      ticketId: 'TKT-1767891364803-Y39YSPS1O',
      eventId: 1,
      eventTitle: 'Tech Conference 2026',
      userName: 'Rolly',
      email: 'aeln@email.com',
      company: 'TUBOL'
    },
    {
      ticketId: 'TKT-1767893136483-Y39YSPS10',
      eventId: 2,
      eventTitle: 'Web Development Workshop',
      userName: 'Marc Andrei',
      email: 'marc@email.com',
      company: 'Tech Corp'
    }
  ];

  const [activeEvent, setActiveEvent] = useState(() => {
    try {
      const stored = localStorage.getItem('activeEvent');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch { /* ignore */ }
    return {
      id: 2,
      title: 'Web Development Workshop',
      date: '2026-01-20',
      time: '14:00 - 18:00',
      location: 'BGC Innovation Hub',
      capacity: 100,
      registered: 87,
      status: 'ongoing',
      description: 'Hands-on workshop focusing on React, TypeScript, and Vite best practices.'
    };
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

  useEffect(() => {
    // Update participants list whenever activeEvent changes
    try {
      const raw = localStorage.getItem('myTickets');
      const tickets = raw ? JSON.parse(raw) : [];
      setParticipants(tickets.filter(t => t.eventId === activeEvent.id));
    } catch {
      setParticipants([]);
    }
  }, [activeEvent]);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [checkedInParticipants, setCheckedInParticipants] = useState(new Set());
  const [cameraActive, setCameraActive] = useState(false);
  const [scannedAttendee, setScannedAttendee] = useState(null);
  const [lastScannedCode, setLastScannedCode] = useState(null);
  const [isScanningPaused, setIsScanningPaused] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanIntervalRef = useRef(null);

  const itemsPerPage = 10;

  useEffect(() => {
    loadJsQR().then(() => startCamera());
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      if (scanIntervalRef.current) {
        cancelAnimationFrame(scanIntervalRef.current);
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
      console.log('Starting camera...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      console.log('Camera stream obtained, setting video element...');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Ensure video is ready to play
        await new Promise(resolve => {
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded, starting playback...');
            videoRef.current.play().then(() => {
              console.log('Video playing, camera active, starting QR scan...');
              setCameraActive(true);
              startQRScanning();
              resolve();
            }).catch(err => {
              console.error('Play error:', err);
              setCameraActive(true);
              startQRScanning();
              resolve();
            });
          };
        });
      }
    } catch (error) {
      console.error('Camera access error:', error);
      setCameraActive(false);
      Swal.fire({
        icon: 'error',
        title: 'Camera Error',
        text: 'Could not access camera. Please check permissions.',
        confirmButtonColor: '#0f766e'
      });
    }
  };

  const startQRScanning = () => {
    if (scanIntervalRef.current) {
      cancelAnimationFrame(scanIntervalRef.current);
    }
    
    console.log('QR Scanning started with requestAnimationFrame');
    
    const scanFrame = () => {
      if (!videoRef.current || !canvasRef.current) {
        scanIntervalRef.current = requestAnimationFrame(scanFrame);
        return;
      }
      
      // Skip scanning if modal is open
      if (isScanningPaused) {
        scanIntervalRef.current = requestAnimationFrame(scanFrame);
        return;
      }
      
      try {
        if (!window.jsQR) {
          console.warn('jsQR library not loaded yet');
          scanIntervalRef.current = requestAnimationFrame(scanFrame);
          return;
        }
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (!ctx || videoRef.current.videoWidth === 0) {
          scanIntervalRef.current = requestAnimationFrame(scanFrame);
          return;
        }

        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = window.jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code && code.data) {
          console.log('QR Code detected:', code.data);
          handleQRScanned(code.data);
        }
      } catch (error) {
        console.error('QR scanning error:', error);
      }
      
      scanIntervalRef.current = requestAnimationFrame(scanFrame);
    };
    
    scanIntervalRef.current = requestAnimationFrame(scanFrame);
  };

  const handleQRScanned = (qrData) => {
    console.log('Raw QR data:', qrData);
    
    // Immediately pause scanning to prevent multiple detections
    setIsScanningPaused(true);
    
    try {
      // Try to parse as JSON (the QR contains the full ticket object)
      let scannedData;
      try {
        scannedData = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
      } catch {
        // If not JSON, treat as plain string
        scannedData = { ticketId: qrData };
      }
      
      // Check if this attendee is in our valid list
      const validAttendee = validAttendees.find(a => a.ticketId === scannedData.ticketId);
      
      if (validAttendee) {
        console.log('Valid attendee found:', validAttendee);
        
        if (lastScannedCode !== qrData) {
          setLastScannedCode(qrData);
          setScannedAttendee(validAttendee); // Show modal for valid attendees
          // Auto mark checked-in if present in participants list
          const matched = participants.find(p => p.ticketId === validAttendee.ticketId);
          if (matched && !checkedInParticipants.has(matched.id)) {
            setCheckedInParticipants(prev => new Set([...prev, matched.id]));
          }
          
          // Also show success alert
          Swal.fire({
            icon: 'success',
            title: 'QR Code Detected!',
            text: `Welcome ${validAttendee.userName}! ✓ Checked In`,
            confirmButtonColor: '#0f766e',
            confirmButtonText: 'OK',
            timer: 3000,
            timerProgressBar: true
          }).then(() => {
            // Resume scanning when alert is closed
            setIsScanningPaused(false);
            setLastScannedCode(null);
          });
        } else {
          // Same code scanned again, just resume
          setIsScanningPaused(false);
        }
      } else {
        console.log('Attendee not found for QR code:', qrData);
        Swal.fire({
          icon: 'error',
          title: 'Invalid QR Code',
          text: 'Attendee not found',
          confirmButtonColor: '#dc2626',
          timer: 3000,
          timerProgressBar: true
        }).then(() => {
          // Resume scanning after error alert
          setIsScanningPaused(false);
        });
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      setIsScanningPaused(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }
    if (scanIntervalRef.current) {
      cancelAnimationFrame(scanIntervalRef.current);
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
          {/* Metrics row under Location - compact size */}
          {(() => {
            const active = checkedInParticipants.size;
            const total = participants.length;
            const inactive = Math.max(total - active, 0);
            const avg = total ? Math.round((active / total) * 100) : 0;
            const cardStyle = {
              background: 'linear-gradient(135deg,#0b1e36 0%, #0f766e 100%)',
              color: 'white',
              borderRadius: '10px',
              padding: '8px 10px',
              minWidth: '120px'
            };
            const labelStyle = { margin: 0, fontSize: '10px', opacity: 0.9 };
            const valueStyle = { margin: '2px 0 0 0', fontSize: '16px', fontWeight: 700 };
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(120px, 1fr))', gap: '10px', marginTop: '10px' }}>
                <div style={cardStyle}>
                  <p style={labelStyle}>Active</p>
                  <p style={valueStyle}>{active}</p>
                </div>
                <div style={cardStyle}>
                  <p style={labelStyle}>Inactive</p>
                  <p style={valueStyle}>{inactive}</p>
                </div>
                <div style={cardStyle}>
                  <p style={labelStyle}>Avg. Active</p>
                  <p style={valueStyle}>{avg}%</p>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Right: Camera Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{
            border: '3px solid #0f766e',
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: '#000',
            aspectRatio: '1',
            maxHeight: '320px',
            position: 'relative'
          }}>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover', 
                display: 'block',
                backgroundColor: '#000'
              }}
            />
            {!cameraActive && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
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
          
          {cameraActive ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-secondary" onClick={stopCamera} style={{ flex: 1, padding: '8px', fontSize: '13px' }}>
                Stop Camera
              </button>
            </div>
          ) : (
            <button className="btn-primary" onClick={startCamera} style={{ padding: '8px', fontSize: '13px' }}>
              📱 Start Camera
            </button>
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

      {scannedAttendee && (
        <AttendeeModal 
          attendee={scannedAttendee} 
          event={activeEvent} 
          isCheckedIn={checkedInParticipants.has(scannedAttendee.id)} 
          onClose={() => {
            setScannedAttendee(null);
            setIsScanningPaused(false);
            setLastScannedCode(null);
          }} 
        />
      )}
    </div>
  );
};

const AttendeeModal = ({ attendee, event, isCheckedIn, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ 
          padding: '40px 30px', 
          textAlign: 'center', 
          background: 'linear-gradient(135deg, #d4f1e8 0%, #e8f9f5 100%)', 
          borderRadius: '16px'
        }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '40px 30px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
            {/* Event Name */}
            <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#888', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: '600' }}>Event Name</p>
            <p style={{ margin: '0 0 20px 0', fontSize: '22px', fontWeight: '700', color: '#0f766e' }}>{event.title}</p>

            {/* Ticket ID */}
            <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#888', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: '600' }}>Ticket ID</p>
            <p style={{ margin: '0 0 30px 0', fontSize: '14px', color: '#666', fontFamily: 'monospace' }}>{attendee.ticketId}</p>

            {/* QR Code Placeholder */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '30px 0' }}>
              <div style={{ 
                width: '200px', 
                height: '200px', 
                backgroundColor: '#f3f4f6', 
                borderRadius: '12px', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed #d1d5db'
              }}>
                <p style={{ color: '#9ca3af', margin: 0 }}>✓ QR Scanned</p>
              </div>
            </div>

            {/* Attendee Info */}
            <p style={{ margin: '30px 0 8px 0', fontSize: '13px', color: '#888', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: '600' }}>Attendee Name</p>
            <p style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>{attendee.userName}</p>

            <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#888', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: '600' }}>Email</p>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#666' }}>{attendee.email || '—'}</p>

            {attendee.company && (
              <>
                <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#888', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: '600' }}>Company Name</p>
                <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#666' }}>{attendee.company}</p>
              </>
            )}

            {/* Check-in Status */}
            <div style={{ 
              marginTop: '20px', 
              padding: '15px', 
              backgroundColor: isCheckedIn ? '#d1fae5' : '#fef3c7', 
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <p style={{ 
                margin: '0', 
                fontSize: '16px', 
                fontWeight: '700',
                color: isCheckedIn ? '#065f46' : '#92400e'
              }}>
                {isCheckedIn ? '✓ Checked In' : 'Pending Check-in'}
              </p>
            </div>

            {/* OK Button */}
            <button 
              className="btn-primary" 
              onClick={onClose}
              style={{ width: '100%', padding: '12px', fontSize: '16px', marginTop: '20px' }}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTickets;
