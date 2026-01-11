import React, { useEffect, useState, useRef } from 'react';
import { deriveStatusKey } from '../../shared/utils/eventStatus';
import Swal from 'sweetalert2';
import { authService } from '../../shared/services/authService';
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
        const parsed = JSON.parse(stored);
        // only treat stored event as active when it's actually ongoing
        if (deriveStatusKey(parsed) === 'ongoing' || parsed.status === 'ongoing') return parsed;
      }
    } catch { /* ignore */ }
    return null; // no active event by default
  });
  const [activeEvents, setActiveEvents] = useState([]);

  // Fetch the active event from the server (prefer events created by the logged-in user)
  // helper to fetch active event; exported for manual refresh button below
  const fetchActiveEvent = async () => {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
    const url = userId ? `${base}/events/by-creator/${userId}` : `${base}/events`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
  const ongoingList = list.filter(e => (deriveStatusKey(e) === 'ongoing' || e.status === 'ongoing') && !isEventEnded(e));
      if (ongoingList.length > 0) {
        setActiveEvents(ongoingList);
        setActiveEvent(prev => {
          // keep current selection if still present
          const currentId = prev && prev.id;
          const keep = ongoingList.find(e => String(e.id) === String(currentId));
          const chosen = keep || ongoingList[0];
          try { localStorage.setItem('activeEvent', JSON.stringify(chosen)); } catch {}
          return chosen;
        });
      } else {
        setActiveEvents([]);
        setActiveEvent(null);
        try { localStorage.removeItem('activeEvent'); } catch {}
      }
    } catch (err) {
      console.error('Failed to load active event', err);
      setActiveEvent(null);
    }
  };

  useEffect(() => {
    fetchActiveEvent();
    const poll = setInterval(fetchActiveEvent, 60_000);
    return () => clearInterval(poll);
  }, []);

  const [participants, setParticipants] = useState(() => {
    try {
      const raw = localStorage.getItem('myTickets');
      const tickets = raw ? JSON.parse(raw) : [];
      return activeEvent && activeEvent.id ? tickets.filter(t => t.eventId === activeEvent.id) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    // Update participants list whenever activeEvent changes
    if (!activeEvent) {
      setParticipants([]);
      return;
    }

    const fetchParticipantsForActive = async (eventId) => {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      try {
        const res = await fetch(`${base}/events/${eventId}/attendees`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        const mapped = list.map(a => ({
          id: a.id,
          userName: a.attendeeName || (a.attendee && (a.attendee.firstName ? `${a.attendee.firstName} ${a.attendee.lastName}` : a.attendee.username)) || 'Attendee',
          email: (a.attendee && a.attendee.email) || (a.admin && a.admin.email) || '',
          ticketId: a.ticketCode,
          registeredAt: a.registeredAt,
          status: a.status
        }));
        setParticipants(mapped);
        const initialChecked = new Set(list.filter(x => x.status && x.status !== 'inactive').map(x => x.id));
        setCheckedInParticipants(initialChecked);
      } catch (err) {
        console.error('Failed to load participants from server, falling back to local', err);
        try {
          const raw = localStorage.getItem('myTickets');
          const tickets = raw ? JSON.parse(raw) : [];
          setParticipants(tickets.filter(t => t.eventId === eventId));
        } catch {
          setParticipants([]);
        }
      }
    };

    fetchParticipantsForActive(activeEvent.id);
  }, [activeEvent]);

  // allow manual refresh of participants
  const refreshParticipants = () => {
    if (!activeEvent) return;
    const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    fetch(`${base}/events/${activeEvent.id}/attendees`).then(async (res) => {
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      const mapped = list.map(a => ({
        id: a.id,
        userName: a.attendeeName || (a.attendee && (a.attendee.firstName ? `${a.attendee.firstName} ${a.attendee.lastName}` : a.attendee.username)) || 'Attendee',
        email: (a.attendee && a.attendee.email) || (a.admin && a.admin.email) || '',
        ticketId: a.ticketCode,
        registeredAt: a.registeredAt,
        status: a.status
      }));
      setParticipants(mapped);
      const initialChecked = new Set(list.filter(x => x.status && x.status !== 'inactive').map(x => x.id));
      setCheckedInParticipants(initialChecked);
    }).catch((err) => {
      console.error('Failed to refresh participants', err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Could not refresh participants', confirmButtonColor: '#ef4444' });
    });
  };

  // When user selects a different active event from the list
  const selectActiveEvent = (ev) => {
    // guard against selecting an event that's already ended
    if (isEventEnded(ev)) {
      Swal.fire({ icon: 'warning', title: 'Event Ended', text: 'This event has already ended and cannot be selected.', confirmButtonColor: '#0f766e' });
      fetchActiveEvent();
      return;
    }
    setActiveEvent(ev);
    try { localStorage.setItem('activeEvent', JSON.stringify(ev)); } catch {}
  };

  // Determine if an event's end date/time has already passed
  const isEventEnded = (ev) => {
    if (!ev) return true;
    // prefer explicit endDate
    if (ev.endDate) {
      const d = new Date(ev.endDate);
      if (!isNaN(d.getTime())) return d.getTime() <= Date.now();
    }
    try {
      if (ev.date && ev.time) {
        const parts = ev.time.split(' - ').map(s => s.trim());
        const endPart = parts[1] || parts[0];
        const m = endPart.match(/(\d{1,2}):(\d{2})\s*([AaPp][Mm])?/);
        if (m) {
          let hour = Number(m[1]);
          const minute = m[2];
          const ampm = m[3];
          if (ampm) {
            if (ampm.toUpperCase() === 'PM' && hour !== 12) hour += 12;
            if (ampm.toUpperCase() === 'AM' && hour === 12) hour = 0;
          }
          let dateOnly = ev.date;
          if (dateOnly.includes('T')) dateOnly = dateOnly.split('T')[0];
          const iso = `${dateOnly}T${String(hour).padStart(2,'0')}:${minute}:00`;
          const d2 = new Date(iso);
          if (!isNaN(d2.getTime())) return d2.getTime() <= Date.now();
        }
      }
    } catch {
      return false;
    }
    return false;
  };

  // Clear or refresh active event when its end time passes
  useEffect(() => {
    let timerId;
    const getEndDate = (ev) => {
      if (!ev) return null;
      if (ev.endDate) {
        const d = new Date(ev.endDate);
        if (!isNaN(d.getTime())) return d;
      }
      // fallback to parsing end time from ev.time and ev.date
      try {
        if (ev.date && ev.time) {
          const parts = ev.time.split(' - ').map(s => s.trim());
          const endPart = parts[1] || parts[0];
          const m = endPart.match(/(\d{1,2}):(\d{2})\s*([AaPp][Mm])?/);
          if (m) {
            let hour = Number(m[1]);
            const minute = m[2];
            const ampm = m[3];
            if (ampm) {
              if (ampm.toUpperCase() === 'PM' && hour !== 12) hour += 12;
              if (ampm.toUpperCase() === 'AM' && hour === 12) hour = 0;
            }
            let dateOnly = ev.date;
            if (dateOnly.includes('T')) dateOnly = dateOnly.split('T')[0];
            const iso = `${dateOnly}T${String(hour).padStart(2,'0')}:${minute}:00`;
            const d2 = new Date(iso);
            if (!isNaN(d2.getTime())) return d2;
          }
        }
      } catch {
        return null;
      }
      return null;
    };

    if (!activeEvent) return undefined;
    const endDt = getEndDate(activeEvent);
    if (!endDt) return undefined;
    const now = new Date();
    if (endDt.getTime() <= now.getTime()) {
      // already ended - refresh list to remove it
      fetchActiveEvent();
      return undefined;
    }
    const ms = endDt.getTime() - now.getTime() + 500; // small buffer
    timerId = setTimeout(() => {
      fetchActiveEvent();
    }, ms);
    return () => clearTimeout(timerId);
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
    // Preload jsQR library but do NOT start camera automatically.
    loadJsQR();
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
    if (!activeEvent) {
      Swal.fire({ icon: 'warning', title: 'No Active Event', text: 'There is no active event to scan.', confirmButtonColor: '#0f766e' });
      return;
    }
    try {
      // Ensure jsQR is available before starting camera
      await loadJsQR();

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

  const handleQRScanned = async (qrData) => {
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

        // Normalize common ticket fields (ticketId, ticketCode, ticket)
        const ticketCode = (scannedData && (scannedData.ticketId || scannedData.ticketCode || scannedData.ticket || scannedData.code || scannedData.ticket_code)) || (typeof scannedData === 'string' ? scannedData : null);

        // If the QR is for a different event, warn and ignore
        if (scannedData && scannedData.eventId && activeEvent && String(scannedData.eventId) !== String(activeEvent.id)) {
          Swal.fire({ icon: 'warning', title: 'Wrong Event', text: 'This ticket is for a different event.', confirmButtonColor: '#0f766e' }).then(() => setIsScanningPaused(false));
          return;
        }

        // Try to find a participant record in the current list first
        let matched = ticketCode ? participants.find(p => p.ticketId === ticketCode) : null;

        // helper to show success and mark checked-in where possible
        const handleSuccess = (person, displayName) => {
          if (lastScannedCode !== qrData) {
            setLastScannedCode(qrData);
            setScannedAttendee(person || { id: null, userName: displayName || 'Attendee', ticketId: ticketCode });
            if (person && person.id && !checkedInParticipants.has(person.id)) {
              setCheckedInParticipants(prev => new Set([...prev, person.id]));
            }
            // stop camera and scanning when attendee details and alert are shown
            try { stopCamera(); } catch (e) { /* ignore */ }
            // Persist check-in to server if we have a registration id
            (async () => {
              if (person && person.id) {
                const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                try {
                  const token = authService.getToken();
                  const res = await fetch(`${base}/events/${person.id}/check-in`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      ...(token ? { Authorization: `Bearer ${token}` } : {})
                    }
                  });
                  if (!res.ok) {
                    // revert UI change
                    setCheckedInParticipants(prev => {
                      const next = new Set(prev);
                      next.delete(person.id);
                      return next;
                    });
                    const txt = await res.text();
                    console.error('Failed to persist check-in', txt);
                    if (res.status === 401) {
                      Swal.fire({ icon: 'warning', title: 'Unauthorized', text: 'Please login to persist check-ins.', confirmButtonColor: '#0f766e' }).then(() => {
                        try { window.location.href = '/login'; } catch {}
                      });
                    } else {
                      Swal.fire({ icon: 'error', title: 'Error', text: 'Could not persist check-in to server', confirmButtonColor: '#ef4444' });
                    }
                  }
                } catch (err) {
                  // revert UI change
                  setCheckedInParticipants(prev => {
                    const next = new Set(prev);
                    next.delete(person.id);
                    return next;
                  });
                  console.error('Check-in request failed', err);
                  Swal.fire({ icon: 'error', title: 'Error', text: 'Could not persist check-in to server', confirmButtonColor: '#ef4444' });
                }
              }
              Swal.fire({ icon: 'success', title: 'QR Code Detected!', text: `Welcome ${displayName || (person && person.userName) || 'Attendee'}! ✓ Checked In`, confirmButtonColor: '#0f766e', confirmButtonText: 'OK', timer: 3000, timerProgressBar: true }).then(() => {
                // keep scanning paused and camera stopped; clear last code so next manual start works cleanly
                setLastScannedCode(null);
              });
            })();
          } else {
            setIsScanningPaused(false);
          }
        };

        // If not found in current participants, try refreshing from server (if activeEvent exists)
        if (!matched && activeEvent && activeEvent.id && ticketCode) {
          try {
            const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const res = await fetch(`${base}/events/${activeEvent.id}/attendees`);
            if (res.ok) {
              const data = await res.json();
              const list = Array.isArray(data) ? data : [];
              const mapped = list.map(a => ({
                id: a.id,
                userName: a.attendeeName || (a.attendee && (a.attendee.firstName ? `${a.attendee.firstName} ${a.attendee.lastName}` : a.attendee.username)) || 'Attendee',
                email: (a.attendee && a.attendee.email) || (a.admin && a.admin.email) || '',
                ticketId: a.ticketCode,
                registeredAt: a.registeredAt,
                status: a.status
              }));
              setParticipants(mapped);
              const initialChecked = new Set(list.filter(x => x.status && x.status !== 'inactive').map(x => x.id));
              setCheckedInParticipants(initialChecked);
              matched = mapped.find(p => p.ticketId === ticketCode) || null;
            }
          } catch (err) {
            console.error('Failed to refresh participants during scan', err);
          }
        }

        // If found in participants, success
        if (matched) {
          handleSuccess(matched, matched.userName);
          return;
        }

        // fallback: check static list
        const validAttendee = ticketCode ? validAttendees.find(a => a.ticketId === ticketCode) : null;
        if (validAttendee) {
          handleSuccess({ id: null, userName: validAttendee.userName, email: validAttendee.email, ticketId: validAttendee.ticketId }, validAttendee.userName);
          return;
        }

        // Not found anywhere
        console.log('Attendee not found for QR code:', qrData);
        Swal.fire({ icon: 'error', title: 'Invalid QR Code', text: 'Attendee not found', confirmButtonColor: '#dc2626', timer: 3000, timerProgressBar: true }).then(() => setIsScanningPaused(false));
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
    if (!activeEvent) {
      Swal.fire({ icon: 'warning', title: 'No Active Event', text: 'There is no active event to export.', confirmButtonColor: '#0f766e' });
      return;
    }
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

      {activeEvent ? (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '30px' }}>
          {/* Left: Event Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* If there are multiple ongoing events, allow selection */}
                {activeEvents && activeEvents.length > 1 && (
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                    {activeEvents.map(ev => (
                      <button
                        key={ev.id}
                        onClick={() => selectActiveEvent(ev)}
                        className={String(ev.id) === String(activeEvent?.id) ? 'btn-primary' : 'btn-secondary'}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {ev.title} <span style={{ marginLeft: '8px', opacity: 0.8 }}>· {new Date(ev.date).toLocaleDateString()}</span>
                      </button>
                    ))}
                  </div>
                )}
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
                {(() => {
                  // show end date/time if available or parseable
                  const getEnd = (ev) => {
                    if (!ev) return null;
                    if (ev.endDate) {
                      const d = new Date(ev.endDate);
                      if (!isNaN(d.getTime())) return d;
                    }
                    try {
                      if (ev.date && ev.time) {
                        const parts = ev.time.split(' - ').map(s => s.trim());
                        const endPart = parts[1] || parts[0];
                        const m = endPart.match(/(\d{1,2}):(\d{2})\s*([AaPp][Mm])?/);
                        if (m) {
                          let hour = Number(m[1]);
                          const minute = m[2];
                          const ampm = m[3];
                          if (ampm) {
                            if (ampm.toUpperCase() === 'PM' && hour !== 12) hour += 12;
                            if (ampm.toUpperCase() === 'AM' && hour === 12) hour = 0;
                          }
                          let dateOnly = ev.endDate || ev.date;
                          if (dateOnly.includes('T')) dateOnly = dateOnly.split('T')[0];
                          const iso = `${dateOnly}T${String(hour).padStart(2,'0')}:${minute}:00`;
                          const d2 = new Date(iso);
                          if (!isNaN(d2.getTime())) return d2;
                        }
                      }
                    } catch {}
                    return null;
                  };
                  const endDt = getEnd(activeEvent);
                  if (!endDt) return null;
                  return (
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>End</p>
                      <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#333' }}>{endDt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {endDt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  );
                })()}
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
  ) : (
    <div style={{ padding: '40px', textAlign: 'center', color: '#666', marginBottom: '30px' }}>
      <h3 style={{ marginBottom: '8px' }}>No Active Event</h3>
      <p style={{ margin: 0 }}>There is no ongoing event at the moment.</p>
      <div style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
        <button className="btn-primary" onClick={fetchActiveEvent}>Refresh</button>
  <button className="btn-secondary" onClick={() => { try { window.location.href = '/organizer/dashboard'; } catch {} }}>Go to Events</button>
      </div>
    </div>
  )}
      

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
          <button
            className="btn-secondary"
            onClick={refreshParticipants}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            disabled={!activeEvent}
            title={!activeEvent ? 'No active event' : 'Refresh participants'}
          >
            ↻ Refresh
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
