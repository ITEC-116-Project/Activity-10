import React, { useState } from 'react';
import Swal from 'sweetalert2';

const CreateEventModal = ({ onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  // separate date and 12-hour time components
  const now = new Date();
  const pad = (v) => String(v).padStart(2, '0');
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
  const to12 = (h24) => {
    const ampm = h24 >= 12 ? 'PM' : 'AM';
    let h = h24 % 12;
    if (h === 0) h = 12;
    return { hour: String(h), ampm };
  };

  const defaultStartDate = todayLocalISO();
  const { hour: defStartHour, ampm: defStartAMPM } = to12(now.getHours());
  const defStartMinute = pad(Math.floor(now.getMinutes() / 5) * 5);
  const endDefault = new Date(now.getTime() + 60 * 60 * 1000);
  const { hour: defEndHour, ampm: defEndAMPM } = to12(endDefault.getHours());
  const defEndMinute = pad(Math.floor(endDefault.getMinutes() / 5) * 5);

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [startHour, setStartHour] = useState(defStartHour);
  const [startMinute, setStartMinute] = useState(defStartMinute);
  const [startAMPM, setStartAMPM] = useState(defStartAMPM);

  const [endDate, setEndDate] = useState(defaultStartDate);
  const [endHour, setEndHour] = useState(defEndHour);
  const [endMinute, setEndMinute] = useState(defEndMinute);
  const [endAMPM, setEndAMPM] = useState(defEndAMPM);
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !startHour || !startMinute || !startAMPM || !endDate || !endHour || !endMinute || !endAMPM || !location.trim() || !capacity) {
      Swal.fire({ icon: 'warning', title: 'Missing fields', text: 'Please fill in all required fields.', confirmButtonColor: '#0f766e' });
      return;
    }

    // build Date objects from separate date/time components (12-hour)
    const to24 = (hour12, minute, ampm) => {
      let h = Number(hour12);
      const m = String(minute).padStart(2, '0');
      if (ampm === 'AM' && h === 12) h = 0;
      if (ampm === 'PM' && h !== 12) h = h + 12;
      return `${String(h).padStart(2,'0')}:${m}`;
    };

    const startTime24 = to24(startHour, startMinute, startAMPM);
    const endTime24 = to24(endHour, endMinute, endAMPM);
    const start = new Date(`${startDate}T${startTime24}`);
    const end = new Date(`${endDate}T${endTime24}`);
    if (end <= start) {
      Swal.fire({ icon: 'warning', title: 'Invalid dates', text: 'End date/time must be after start date/time.', confirmButtonColor: '#0f766e' });
      return;
    }
    const minDate = todayLocalISO();
    if (new Date(startDate) < new Date(minDate)) {
      Swal.fire({ icon: 'warning', title: 'Invalid start date', text: 'Start date cannot be in the past.', confirmButtonColor: '#0f766e' });
      return;
    }
    // also ensure start time is not in the past when date is today
    if (startDate === todayLocalISO() && start.getTime() < Date.now()) {
      Swal.fire({ icon: 'warning', title: 'Invalid start time', text: 'Start time cannot be in the past.', confirmButtonColor: '#0f766e' });
      return;
    }
    const now = new Date();
    let status = 'upcoming';
  if (start <= now && now <= end) status = 'ongoing';
  else if (end < now) status = 'completed';

    const payload = {
      title: title.trim(),
  date: start.toISOString(),
  endDate: end.toISOString(),
  time: `${new Date(`${startDate}T${startTime24}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(`${endDate}T${endTime24}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      location: location.trim(),
      capacity: parseInt(capacity, 10) || 0,
      registered: 0,
      status,
      description: description.trim(),
      createdBy: localStorage.getItem('userId') || '1',
      createdByName: `${localStorage.getItem('firstName') || sessionStorage.getItem('firstName') || ''} ${localStorage.getItem('lastName') || sessionStorage.getItem('lastName') || ''}`.trim() || 'Organizer',
      createdByFirstName: localStorage.getItem('firstName') || sessionStorage.getItem('firstName') || '',
      createdByLastName: localStorage.getItem('lastName') || sessionStorage.getItem('lastName') || '',
      createdByEmail: localStorage.getItem('email') || sessionStorage.getItem('email') || 'organizer@email.com'
    };

    setSubmitting(true);
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        setSubmitting(false);
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || 'Failed to create event');
        }
        return res.json();
      })
      .then((created) => {
        Swal.fire({ icon: 'success', title: 'Event Created', text: 'Your event was saved to the database.', confirmButtonColor: '#0f766e' });
        onCreate && onCreate(created);
      })
      .catch((err) => {
        setSubmitting(false);
        console.error('Create event error', err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Could not create event. Please try again.', confirmButtonColor: '#ef4444' });
      });
  };

  const [submitting, setSubmitting] = useState(false);

  const inputStyle = { width: '100%', padding: '12px 14px', border: '1px solid #d1d5db', borderRadius: '8px', boxSizing: 'border-box', color: '#111', backgroundColor: '#fff' };
  const selectStyle = { ...inputStyle, paddingRight: '36px' };
  const labelStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '13px',
    color: '#0f766e',
    fontWeight: 600,
    textTransform: 'none',
    letterSpacing: '0.01em'
  };
  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 32px 16px',
    borderBottom: '1px solid #e5e7eb'
  };
  const bodyStyle = {
    padding: '24px 32px 32px',
    display: 'grid',
    gap: '18px'
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content modal-large"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '760px', padding: 0, overflow: 'hidden' }}
      >
        <div style={headerStyle}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', color: '#0f766e', fontWeight: 700 }}>Create Event</h2>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6b7280' }}>Share the basics of your upcoming event.</p>
          </div>
          <button className="close-button" onClick={onClose} style={{ position: 'static', fontSize: '20px' }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={bodyStyle}>
          <label style={labelStyle}>
            Event Title *
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required style={inputStyle} placeholder="e.g. Tech Conference 2026" />
          </label>

          <label style={labelStyle}>
            Description *
            <textarea
              rows="4"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ ...inputStyle, resize: 'vertical', minHeight: '110px' }}
              placeholder="Add a short overview for attendees"
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>
                  Date *
                    <input type="date" min={todayLocalISO()} value={startDate} onChange={(e) => {
                      const v = e.target.value;
                      setStartDate(v);
                      // ensure endDate is not before startDate
                      if (v > endDate) setEndDate(v);
                      // if selecting today, auto-fix minute if current combination is already past
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
                    }} required style={inputStyle} />
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <select value={startHour} onChange={(e) => {
                    const v = e.target.value;
                    setStartHour(v);
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
                        const found = minutes.find(m => new Date(`${startDate}T${to24(v,m,startAMPM)}`).getTime() >= Date.now());
                        if (found) setStartMinute(found);
                      }
                    }
                  }} style={selectStyle}>
                    {Array.from({ length: 12 }).map((_, i) => {
                      const v = String(i+1).padStart(2,'0');
                      // disable hour if all minutes in that hour are already past (when startDate is today)
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
                  <select value={startMinute} onChange={(e) => setStartMinute(e.target.value)} style={selectStyle}>
                      {['00','05','10','15','20','25','30','35','40','45','50','55'].map(m => {
                        // disable minutes that would result in a past time when startDate is today
                        const isPast = (() => {
                          const today = todayLocalISO();
                          if (startDate !== today) return false;
                          const to24 = (hour12, minute, ampm) => {
                            let h = Number(hour12);
                            const mm = String(minute).padStart(2, '0');
                            if (ampm === 'AM' && h === 12) h = 0;
                            if (ampm === 'PM' && h !== 12) h = h + 12;
                            return `${String(h).padStart(2,'0')}:${mm}`;
                          };
                          const t = to24(startHour, m, startAMPM);
                          const dt = new Date(`${startDate}T${t}`);
                          return dt.getTime() < Date.now();
                        })();
                        return <option key={m} value={m} disabled={isPast}>{m}</option>;
                      })}
                  </select>
                  <select value={startAMPM} onChange={(e) => {
                    const v = e.target.value;
                    setStartAMPM(v);
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
                  }} style={selectStyle}>
                    <option>AM</option>
                    <option>PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>
                  End Date *
                  <input type="date" min={startDate || todayLocalISO()} value={endDate} onChange={(e) => {
                    const v = e.target.value;
                    setEndDate(v);
                            // if selecting today, auto-fix end minute if necessary
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
                  }} required style={inputStyle} />
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <select value={endHour} onChange={(e) => setEndHour(e.target.value)} style={selectStyle}>
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
                  <select value={endMinute} onChange={(e) => setEndMinute(e.target.value)} style={selectStyle}>
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
                  <select value={endAMPM} onChange={(e) => setEndAMPM(e.target.value)} style={selectStyle}>
                    <option>AM</option>
                    <option>PM</option>
                  </select>
                </div>
              </div>
            </div>

            <label style={labelStyle}>
              Location *
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} required style={inputStyle} placeholder="Venue or address" />
            </label>

            <label style={labelStyle}>
              Capacity *
              <input type="number" min="0" value={capacity} onChange={(e) => setCapacity(e.target.value)} required style={inputStyle} placeholder="Expected attendees" />
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
              <button type="button" className="btn-secondary" onClick={onClose} style={{ minWidth: '120px' }}>Cancel</button>
              <button type="submit" className="btn-primary" style={{ minWidth: '150px' }}>{submitting ? 'Saving...' : 'Create Event'}</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;
