import React, { useState } from 'react';
import Swal from 'sweetalert2';

const EventsEditModal = ({ event, onClose, onSave }) => {
  // parse initial date and 12-hour time components
  const parseInitial = (ev) => {
    const safe = ev || {};
    // default date
    let startDate = '';
    let endDate = '';
    let startHour = '09'; let startMinute = '00'; let startAMPM = 'AM';
    let endHour = '10'; let endMinute = '00'; let endAMPM = 'AM';

    if (safe.date) {
      const d = new Date(safe.date);
      if (!isNaN(d.getTime())) startDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
    if (safe.endDate) {
      const d2 = new Date(safe.endDate);
      if (!isNaN(d2.getTime())) endDate = `${d2.getFullYear()}-${String(d2.getMonth()+1).padStart(2,'0')}-${String(d2.getDate()).padStart(2,'0')}`;
    }

    // prefer parsing from event.time if available
    if (safe.time) {
      const parts = safe.time.split(' - ').map(s => s.trim());
      if (parts[0]) {
        const m = parts[0].match(/(\d{1,2}):(\d{2})\s*([AaPp][Mm])?/);
        if (m) {
          startHour = String(Number(m[1])).padStart(2,'0');
          startMinute = m[2];
          startAMPM = m[3] ? m[3].toUpperCase() : (Number(m[1])>=12 ? 'PM' : 'AM');
        }
      }
      if (parts[1]) {
        const m2 = parts[1].match(/(\d{1,2}):(\d{2})\s*([AaPp][Mm])?/);
        if (m2) {
          endHour = String(Number(m2[1])).padStart(2,'0');
          endMinute = m2[2];
          endAMPM = m2[3] ? m2[3].toUpperCase() : (Number(m2[1])>=12 ? 'PM' : 'AM');
        }
      }
    } else {
      // fallback to dates' time components
      if (safe.date) {
        const d = new Date(safe.date);
        if (!isNaN(d.getTime())) {
          const hh = d.getHours();
          const mm = d.getMinutes();
          const am = hh >= 12 ? 'PM' : 'AM';
          let h12 = hh % 12; if (h12 === 0) h12 = 12;
          startHour = String(h12).padStart(2,'0');
          startMinute = String(mm).padStart(2,'0');
          startAMPM = am;
        }
      }
      if (safe.endDate) {
        const d2 = new Date(safe.endDate);
        if (!isNaN(d2.getTime())) {
          const hh = d2.getHours();
          const mm = d2.getMinutes();
          const am = hh >= 12 ? 'PM' : 'AM';
          let h12 = hh % 12; if (h12 === 0) h12 = 12;
          endHour = String(h12).padStart(2,'0');
          endMinute = String(mm).padStart(2,'0');
          endAMPM = am;
        }
      }
    }

    // defaults if missing
  const today = new Date();
  if (!startDate) startDate = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    if (!endDate) endDate = startDate;

    return { startDate, startHour, startMinute, startAMPM, endDate, endHour, endMinute, endAMPM };
  };

  const init = parseInitial(event);
  const pad = (v) => String(v).padStart(2,'0');
  const todayLocalISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const toLocalISO = (isoOrDate) => {
    if (!isoOrDate) return null;
    const d = new Date(isoOrDate);
    if (isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const minDate = todayLocalISO();
  const [title, setTitle] = useState(event.title || '');
  const [startDate, setStartDate] = useState(init.startDate);
  const [startHour, setStartHour] = useState(init.startHour);
  const [startMinute, setStartMinute] = useState(init.startMinute);
  const [startAMPM, setStartAMPM] = useState(init.startAMPM);
  const [endDate, setEndDate] = useState(init.endDate);
  const [endHour, setEndHour] = useState(init.endHour);
  const [endMinute, setEndMinute] = useState(init.endMinute);
  const [endAMPM, setEndAMPM] = useState(init.endAMPM);
  const [location, setLocation] = useState(event.location || '');
  const [capacity, setCapacity] = useState(event.capacity || 0);
  const [description, setDescription] = useState(event.description || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate || !startHour || !startMinute || !startAMPM || !endHour || !endMinute || !endAMPM || !location.trim() || !capacity) {
      Swal.fire({ icon: 'warning', title: 'Missing fields', text: 'Please fill all required fields.', confirmButtonColor: '#0f766e' });
      return;
    }
    const to24 = (hour12, minute, ampm) => {
      let h = Number(hour12);
      const m = String(minute).padStart(2,'0');
      if (ampm === 'AM' && h === 12) h = 0;
      if (ampm === 'PM' && h !== 12) h = h + 12;
      return `${String(h).padStart(2,'0')}:${m}`;
    };

    const startTime24 = to24(startHour, startMinute, startAMPM);
    const endTime24 = to24(endHour, endMinute, endAMPM);
    const startISO = new Date(`${startDate}T${startTime24}`).toISOString();
    const endISO = new Date(`${endDate}T${endTime24}`).toISOString();
    if (new Date(endISO) <= new Date(startISO)) {
      Swal.fire({ icon: 'warning', title: 'Invalid dates', text: 'End must be after start.', confirmButtonColor: '#0f766e' });
      return;
    }
  const minDate = todayLocalISO();
    // allow saving unchanged past events, but disallow changing the start date to a past date
  const origDate = event?.date ? toLocalISO(event.date) : null;
    if (new Date(startDate) < new Date(minDate) && startDate !== origDate) {
      Swal.fire({ icon: 'warning', title: 'Invalid start date', text: 'Start date cannot be in the past.', confirmButtonColor: '#0f766e' });
      return;
    }
    // prevent setting a start time in the past for today's date unless it's the original unchanged start
    const startDt = new Date(startISO);
    const now = new Date();
    const origISO = event?.date ? new Date(event.date).toISOString() : null;
  if (startDate === todayLocalISO() && startDt.getTime() < now.getTime() && startISO !== origISO) {
      Swal.fire({ icon: 'warning', title: 'Invalid start time', text: 'Start time cannot be in the past.', confirmButtonColor: '#0f766e' });
      return;
    }
    // prevent setting an end time in the past for today's date unless it's the original unchanged end
    const endDt = new Date(endISO);
    const origEndISO = event?.endDate ? new Date(event.endDate).toISOString() : null;
    if (endDate === todayLocalISO() && endDt.getTime() < now.getTime() && endISO !== origEndISO) {
      Swal.fire({ icon: 'warning', title: 'Invalid end time', text: 'End time cannot be in the past.', confirmButtonColor: '#0f766e' });
      return;
    }

    const payload = {
      title: title.trim(),
      date: startISO,
      endDate: endISO,
      time: `${new Date(`${startDate}T${startTime24}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(`${endDate}T${endTime24}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      location: location.trim(),
      capacity: Number(capacity) || 0,
      description: description.trim(),
    };

    setSubmitting(true);
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/events/${event.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        setSubmitting(false);
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((updated) => {
        Swal.fire({ icon: 'success', title: 'Updated', text: 'Event updated successfully.', confirmButtonColor: '#0f766e' });
        onSave && onSave(updated);
      })
      .catch((err) => {
        setSubmitting(false);
        console.error('Update error', err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Could not update event.', confirmButtonColor: '#ef4444' });
      });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px' }}>
        <div className="modal-header">
          <h2>Edit Event</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px 30px' }}>
          <div style={{ display: 'grid', gap: '12px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: 600 }}>
              Title
              <input style={{ padding: '10px' }} value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: 600 }}>
                  Start Date
                  <input type="date" min={minDate} value={startDate} onChange={(e) => {
                    const v = e.target.value;
                    setStartDate(v);
                    if (v > endDate) setEndDate(v);
                    // if selecting today, auto-fix minute if current combination is past
                    const minutes = ['00','05','10','15','20','25','30','35','40','45','50','55'];
                    const today = todayLocalISO();
                    if (v === today) {
                      const to24 = (hour12, minute, ampm) => {
                        let h = Number(hour12);
                        const mm = String(minute).padStart(2, '0');
                        if (ampm === 'AM' && h === 12) h = 0;
                        if (ampm === 'PM' && h !== 12) h = h + 12;
                        return `${String(h).padStart(2,'0')}:${mm}`;
                      };
                      if (minutes.every(m => new Date(`${v}T${to24(startHour,m,startAMPM)}`).getTime() < Date.now())) {
                        const found = minutes.find(m => new Date(`${v}T${to24(startHour,m,startAMPM)}`).getTime() >= Date.now());
                        if (found) setStartMinute(found);
                      }
                    }
                  }} required style={{ padding: '10px' }} />
                </label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <select value={startHour} onChange={(e) => {
                    const v = e.target.value;
                    setStartHour(v);
                    // auto-fix minute if selected minute becomes invalid
                    const minutes = ['00','05','10','15','20','25','30','35','40','45','50','55'];
                    const today = todayLocalISO();
                    if (startDate === today) {
                      const to24 = (hour12, minute, ampm) => {
                        let h = Number(hour12);
                        const mm = String(minute).padStart(2, '0');
                        if (ampm === 'AM' && h === 12) h = 0;
                        if (ampm === 'PM' && h !== 12) h = h + 12;
                        return `${String(h).padStart(2,'0')}:${mm}`;
                      };
                      if (minutes.every(m => new Date(`${startDate}T${to24(v,m,startAMPM)}`).getTime() < Date.now())) {
                        // pick first minute that is not past (if any)
                        const found = minutes.find(m => new Date(`${startDate}T${to24(v,m,startAMPM)}`).getTime() >= Date.now());
                        if (found) setStartMinute(found);
                      }
                    }
                  }} style={{ padding: '8px' }}>
                    {Array.from({ length: 12 }).map((_, i) => {
                      const v = String(i+1).padStart(2,'0');
                      const minutes = ['00','05','10','15','20','25','30','35','40','45','50','55'];
                      const isHourPast = startDate === todayLocalISO() && minutes.every(m => {
                        const to24 = (hour12, minute, ampm) => {
                          let h = Number(hour12);
                          const mm = String(minute).padStart(2, '0');
                          if (ampm === 'AM' && h === 12) h = 0;
                          if (ampm === 'PM' && h !== 12) h = h + 12;
                          return `${String(h).padStart(2,'0')}:${mm}`;
                        };
                        return new Date(`${startDate}T${to24(v,m,startAMPM)}`).getTime() < Date.now();
                      });
                      return <option key={v} value={v} disabled={isHourPast}>{v}</option>;
                    })}
                  </select>
                  <select value={startMinute} onChange={(e) => setStartMinute(e.target.value)} style={{ padding: '8px' }}>
                    {['00','05','10','15','20','25','30','35','40','45','50','55'].map(m => {
                      const today = todayLocalISO();
                      if (startDate !== today) return <option key={m} value={m}>{m}</option>;
                      const to24 = (hour12, minute, ampm) => {
                        let h = Number(hour12);
                        const mm = String(minute).padStart(2, '0');
                        if (ampm === 'AM' && h === 12) h = 0;
                        if (ampm === 'PM' && h !== 12) h = h + 12;
                        return `${String(h).padStart(2,'0')}:${mm}`;
                      };
                      const t = to24(startHour, m, startAMPM);
                      const dt = new Date(`${startDate}T${t}`);
                      const isPast = dt.getTime() < Date.now();
                      return <option key={m} value={m} disabled={isPast}>{m}</option>;
                    })}
                  </select>
                  <select value={startAMPM} onChange={(e) => {
                    const v = e.target.value;
                    setStartAMPM(v);
                    // auto-fix minute if necessary similar to hour change
                    const minutes = ['00','05','10','15','20','25','30','35','40','45','50','55'];
                    const today = todayLocalISO();
                    if (startDate === today) {
                      const to24 = (hour12, minute, ampm) => {
                        let h = Number(hour12);
                        const mm = String(minute).padStart(2, '0');
                        if (ampm === 'AM' && h === 12) h = 0;
                        if (ampm === 'PM' && h !== 12) h = h + 12;
                        return `${String(h).padStart(2,'0')}:${mm}`;
                      };
                      if (minutes.every(m => new Date(`${startDate}T${to24(startHour,m,v)}`).getTime() < Date.now())) {
                        const found = minutes.find(m => new Date(`${startDate}T${to24(startHour,m,v)}`).getTime() >= Date.now());
                        if (found) setStartMinute(found);
                      }
                    }
                  }} style={{ padding: '8px' }}>
                    <option>AM</option>
                    <option>PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: 600 }}>
                  End Date
                  <input type="date" min={startDate || minDate} value={endDate} onChange={(e) => {
                    const v = e.target.value;
                    setEndDate(v);
                    const minutes = ['00','05','10','15','20','25','30','35','40','45','50','55'];
                    const today = todayLocalISO();
                    if (v === today) {
                      const to24 = (hour12, minute, ampm) => {
                        let h = Number(hour12);
                        const mm = String(minute).padStart(2, '0');
                        if (ampm === 'AM' && h === 12) h = 0;
                        if (ampm === 'PM' && h !== 12) h = h + 12;
                        return `${String(h).padStart(2,'0')}:${mm}`;
                      };
                      if (minutes.every(m => new Date(`${v}T${to24(endHour,m,endAMPM)}`).getTime() < Date.now())) {
                        const found = minutes.find(m => new Date(`${v}T${to24(endHour,m,endAMPM)}`).getTime() >= Date.now());
                        if (found) setEndMinute(found);
                      }
                    }
                  }} required style={{ padding: '10px' }} />
                </label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <select value={endHour} onChange={(e) => setEndHour(e.target.value)} style={{ padding: '8px' }}>
                    {Array.from({ length: 12 }).map((_, i) => {
                      const v = String(i+1).padStart(2,'0');
                      const minutes = ['00','05','10','15','20','25','30','35','40','45','50','55'];
                      const isHourPast = endDate === todayLocalISO() && minutes.every(m => {
                        const to24 = (hour12, minute, ampm) => {
                          let h = Number(hour12);
                          const mm = String(minute).padStart(2, '0');
                          if (ampm === 'AM' && h === 12) h = 0;
                          if (ampm === 'PM' && h !== 12) h = h + 12;
                          return `${String(h).padStart(2,'0')}:${mm}`;
                        };
                        return new Date(`${endDate}T${to24(v,m,endAMPM)}`).getTime() < Date.now();
                      });
                      return <option key={v} value={v} disabled={isHourPast}>{v}</option>;
                    })}
                  </select>
                  <select value={endMinute} onChange={(e) => setEndMinute(e.target.value)} style={{ padding: '8px' }}>
                    {['00','05','10','15','20','25','30','35','40','45','50','55'].map(m => {
                      const today = todayLocalISO();
                        if (endDate !== today) return <option key={m} value={m}>{m}</option>;
                      const to24 = (hour12, minute, ampm) => {
                        let h = Number(hour12);
                        const mm = String(minute).padStart(2, '0');
                        if (ampm === 'AM' && h === 12) h = 0;
                        if (ampm === 'PM' && h !== 12) h = h + 12;
                        return `${String(h).padStart(2,'0')}:${mm}`;
                      };
                      const t = to24(endHour, m, endAMPM);
                      const dt = new Date(`${endDate}T${t}`);
                      const isPast = dt.getTime() < Date.now();
                      return <option key={m} value={m} disabled={isPast}>{m}</option>;
                    })}
                  </select>
                  <select value={endAMPM} onChange={(e) => setEndAMPM(e.target.value)} style={{ padding: '8px' }}>
                    <option>AM</option>
                    <option>PM</option>
                  </select>
                </div>
              </div>
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: 600 }}>
              Location
              <input style={{ padding: '10px' }} value={location} onChange={(e) => setLocation(e.target.value)} required />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: 600 }}>
              Capacity
              <input type="number" min="0" style={{ padding: '10px' }} value={capacity} onChange={(e) => setCapacity(e.target.value)} required />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: 600 }}>
              Description
              <textarea rows="4" style={{ padding: '10px' }} value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventsEditModal;
