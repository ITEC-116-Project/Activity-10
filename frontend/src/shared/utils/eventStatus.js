export function deriveStatusKey(event) {
  if (!event) return 'upcoming';
  const dateStr = event.date;
  let startTime = event.startTime;
  let endTime = event.endTime;
  if (!startTime && event.time) {
    const parts = event.time.split(' - ');
    startTime = parts[0] || '';
    endTime = parts[1] || '';
  }

  const to24 = (t) => {
    if (!t) return null;
    const s = String(t).trim();
    // If includes AM/PM, convert
    const m = s.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
    if (m) {
      let hh = Number(m[1]);
      const mm = m[2];
      const ampm = m[3].toUpperCase();
      if (ampm === 'AM' && hh === 12) hh = 0;
      if (ampm === 'PM' && hh !== 12) hh += 12;
      return `${String(hh).padStart(2, '0')}:${mm}`;
    }
    // If already in 24h format like '09:00', return as-is
    const m2 = s.match(/^(\d{1,2}):(\d{2})$/);
    if (m2) return `${String(Number(m2[1])).padStart(2,'0')}:${m2[2]}`;
    return null;
  };

  // Prefer using explicit ISO timestamps if present (more accurate and timezone-safe)
  if (event?.date && event?.endDate) {
    const start = new Date(event.date);
    const end = new Date(event.endDate);
    const now = new Date();
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      if (now > end) return 'completed';
      if (now >= start && now <= end) return 'ongoing';
      if (now < start) return 'upcoming';
    }
  }

  if (dateStr && startTime && endTime) {
    const startT = to24(startTime);
    const endT = to24(endTime);
    if (!startT || !endT) return event.status || 'upcoming';

    const baseDate = new Date(dateStr);
    if (isNaN(baseDate.getTime())) return event.status || 'upcoming';
    const dateOnly = baseDate.toISOString().slice(0, 10);

    const start = new Date(`${dateOnly}T${startT}`);
    const end = new Date(`${dateOnly}T${endT}`);
    const now = new Date();
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return event.status || 'upcoming';
    if (now > end) return 'completed';

    // If the start DATE matches today's date, treat as ongoing (Active)
    const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (startDate.getTime() === todayDate.getTime()) return 'ongoing';
    if (now >= start && now <= end) return 'ongoing';
    if (now < start) return 'upcoming';
  }

  return event.status || 'upcoming';
}

export function displayStatusLabel(event) {
  const dateStr = event?.date;
  let startTime = event?.startTime;
  let endTime = event?.endTime;
  if (!startTime && event?.time) {
    const parts = event.time.split(' - ');
    startTime = parts[0] || '';
    endTime = parts[1] || '';
  }
  const to24 = (t) => {
    if (!t) return null;
    const s = String(t).trim();
    const m = s.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
    if (m) {
      let hh = Number(m[1]);
      const mm = m[2];
      const ampm = m[3].toUpperCase();
      if (ampm === 'AM' && hh === 12) hh = 0;
      if (ampm === 'PM' && hh !== 12) hh += 12;
      return `${String(hh).padStart(2, '0')}:${mm}`;
    }
    const m2 = s.match(/^(\d{1,2}):(\d{2})$/);
    if (m2) return `${String(Number(m2[1])).padStart(2,'0')}:${m2[2]}`;
    return null;
  };

  // Display label: prefer ISO timestamps as above
  if (event?.date && event?.endDate) {
    const start = new Date(event.date);
    const end = new Date(event.endDate);
    const now = new Date();
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      if (now > end) return 'Completed';
      if (now >= start && now <= end) return 'Active';
      if (now < start) return 'Upcoming';
    }
  }

  if (dateStr && startTime && endTime) {
    const startT = to24(startTime);
    const endT = to24(endTime);
    if (!startT || !endT) return event.status ? String(event.status).charAt(0).toUpperCase() + String(event.status).slice(1) : 'Upcoming';
    const baseDate = new Date(dateStr);
    if (isNaN(baseDate.getTime())) return event.status ? String(event.status).charAt(0).toUpperCase() + String(event.status).slice(1) : 'Upcoming';
    const dateOnly = baseDate.toISOString().slice(0, 10);
    const start = new Date(`${dateOnly}T${startT}`);
    const end = new Date(`${dateOnly}T${endT}`);
    const now = new Date();
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return event.status ? String(event.status).charAt(0).toUpperCase() + String(event.status).slice(1) : 'Upcoming';
  if (now > end) return 'Completed';
  if (now >= start && now <= end) return 'Active';
  if (now < start) return 'Upcoming';
  }

  // Fallback to use existing status string, normalize 'past' to 'Completed'
  const raw = (event && event.status) ? String(event.status).toLowerCase() : 'upcoming';
  if (raw === 'past' || raw === 'completed') return 'Completed';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}
