import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    phone: ''
  });
  const [userMeta, setUserMeta] = useState({ userId: null, role: null });
  const [profileMeta, setProfileMeta] = useState(null); // full profile from DB
  const [lastSynced, setLastSynced] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmittingPwd, setIsSubmittingPwd] = useState(false);

  // show/hide password toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '#e5e7eb', percent: 0 });

  // compute password strength from newPassword
  function computePasswordStrength(pw) {
    if (!pw) return { score: 0, label: '', color: '#e5e7eb', percent: 0 };
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    let label = 'Weak';
    let color = '#ef4444'; // red
    if (score <= 1) {
      label = 'Very Weak';
      color = '#ef4444';
    } else if (score === 2) {
      label = 'Weak';
      color = '#f97316'; // orange
    } else if (score === 3) {
      label = 'Fair';
      color = '#f59e0b'; // amber
    } else if (score === 4) {
      label = 'Good';
      color = '#10b981'; // green
    } else if (score >= 5) {
      label = 'Strong';
      color = '#059669'; // darker green
    }

    const percent = Math.min(100, Math.round((score / 5) * 100));
    return { score, label, color, percent };
  }

  useEffect(() => {
    setPasswordStrength(computePasswordStrength(newPassword));
  }, [newPassword]);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    // Initialize formData with stored values
    setFormData({
      firstName: sessionStorage.getItem('firstName') || localStorage.getItem('firstName') || '',
      lastName: sessionStorage.getItem('lastName') || localStorage.getItem('lastName') || '',
      email: sessionStorage.getItem('email') || localStorage.getItem('email') || '',
      company: sessionStorage.getItem('company') || localStorage.getItem('company') || '',
      phone: sessionStorage.getItem('phone') || localStorage.getItem('phone') || ''
    });

    if (!token) {
      // fall back to localStorage-only behavior
      return;
    }

    // fetch current user info and expanded profile from backend
    fetch('http://localhost:3000/account-login/validate', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => {
        if (!r.ok) throw new Error('Unable to validate user');
        return r.json();
      })
      .then((data) => {
        const { userId, role } = data;
        console.log('[Attendee Profile] Validated user - userId:', userId, 'role:', role);
        
        // Verify this is an attendee account
        if (role !== 'attendees') {
          console.warn('[Attendee Profile] User role is not attendees, but:', role);
        }
        
        setUserMeta({ userId, role });

        // fetch full account details
        return fetch(`http://localhost:3000/manage-account/${role}/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      })
      .then((r) => {
        if (!r.ok) throw new Error('Unable to fetch profile');
        return r.json();
      })
      .then((profile) => {
        console.log('[Attendee Profile] fetched profile:', profile);
        setProfileMeta(profile);
        setLastSynced(new Date().toISOString());

        setFormData({
          firstName: profile.firstName || sessionStorage.getItem('firstName') || '',
          lastName: profile.lastName || sessionStorage.getItem('lastName') || '',
          email: profile.email || sessionStorage.getItem('email') || '',
          company: profile.companyName || sessionStorage.getItem('company') || '',
          phone: profile.phone || sessionStorage.getItem('phone') || ''
        });

        // Keep sessionStorage in sync for offline fallback
        sessionStorage.setItem('firstName', profile.firstName || '');
        sessionStorage.setItem('lastName', profile.lastName || '');
        sessionStorage.setItem('email', profile.email || sessionStorage.getItem('email') || '');
        sessionStorage.setItem('company', profile.companyName || '');
        sessionStorage.setItem('phone', profile.phone || '');
      })
      .catch(() => {
        console.error('[Attendee Profile] Error fetching profile');
        // If backend calls fail, fallback to sessionStorage values already set above
        setFormData({
          firstName: sessionStorage.getItem('firstName') || localStorage.getItem('firstName') || '',
          lastName: sessionStorage.getItem('lastName') || localStorage.getItem('lastName') || '',
          email: sessionStorage.getItem('email') || localStorage.getItem('email') || '',
          company: sessionStorage.getItem('company') || localStorage.getItem('company') || '',
          phone: sessionStorage.getItem('phone') || localStorage.getItem('phone') || ''
        });
      });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    // First name, last name and email are intentionally read-only in the UI.
    // Updates send the available editable fields (company, phone) to the server.

    const token = sessionStorage.getItem('token');

    if (token && userMeta.userId && userMeta.role) {
      // persist to backend
      fetch(`http://localhost:3000/manage-account/${userMeta.role}/${userMeta.userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          companyName: formData.company,
          phone: formData.phone,
        }),
      })
        .then((r) => {
          if (!r.ok) throw new Error('Failed to update profile');
          return r.json();
        })
        .then((updated) => {
          // update local view with the server's authoritative object
          setProfileMeta(updated);

          setFormData({
            firstName: updated.firstName || formData.firstName,
            lastName: updated.lastName || formData.lastName,
            email: updated.email || formData.email,
            company: updated.companyName ?? formData.company,
            phone: updated.phone ?? formData.phone,
          });

          setIsEditing(false);
          Swal.fire({ icon: 'success', title: 'Profile Updated!', text: 'Your profile has been updated successfully.', confirmButtonText: 'OK', confirmButtonColor: '#0f766e' });
        })
        .catch((err) => {
          Swal.fire({ icon: 'error', title: 'Update Failed', text: err.message || 'Unable to save profile', confirmButtonText: 'OK', confirmButtonColor: '#0f766e' });
        });
    } else {
      Swal.fire({ icon: 'error', title: 'Error', text: 'You must be logged in to update your profile', confirmButtonText: 'OK', confirmButtonColor: '#0f766e' });
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: profileMeta?.firstName || '',
      lastName: profileMeta?.lastName || '',
      email: profileMeta?.email || '',
      company: profileMeta?.companyName || '',
      phone: profileMeta?.phone || ''
    });
    setIsEditing(false);
  };

  const refreshProfile = async () => {
    const token = sessionStorage.getItem('token');
    if (!token || !userMeta.userId || !userMeta.role) {
      Swal.fire({ icon: 'warning', title: 'Unable to refresh', text: 'You need to be logged in to refresh profile.', confirmButtonText: 'OK', confirmButtonColor: '#0f766e' });
      return;
    }

    try {
      const r = await fetch(`http://localhost:3000/manage-account/${userMeta.role}/${userMeta.userId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error(`Status ${r.status}`);
      const profile = await r.json();
      console.log('[Attendee Profile] refreshed profile:', profile);
      setProfileMeta(profile);
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        company: profile.companyName || '',
        phone: profile.phone || ''
      });
      setLastSynced(new Date().toISOString());
      Swal.fire({ icon: 'success', title: 'Refreshed', text: 'Profile refreshed from server.', confirmButtonText: 'OK', confirmButtonColor: '#0f766e' });
    } catch (err) {
      console.error('Profile refresh failed', err);
      Swal.fire({ icon: 'error', title: 'Refresh failed', text: err?.message || 'Unable to refresh profile', confirmButtonText: 'OK', confirmButtonColor: '#0f766e' });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      Swal.fire({ icon: 'warning', title: 'Missing fields', text: 'Please fill in all password fields', confirmButtonText: 'OK', confirmButtonColor: '#0f766e' });
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire({ icon: 'warning', title: 'Mismatch', text: 'New passwords do not match', confirmButtonText: 'OK', confirmButtonColor: '#0f766e' });
      return;
    }

    if (newPassword.length < 8) {
      Swal.fire({ icon: 'warning', title: 'Weak password', text: 'New password must be at least 8 characters', confirmButtonText: 'OK', confirmButtonColor: '#0f766e' });
      return;
    }

    const token = sessionStorage.getItem('token');
    if (!token) {
      Swal.fire({ icon: 'error', title: 'Not authenticated', text: 'Please log in first to change your password', confirmButtonText: 'OK', confirmButtonColor: '#0f766e' });
      return;
    }

    setIsSubmittingPwd(true);

    try {
      const r = await fetch('http://localhost:3000/account-login/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const ct = (r.headers.get('content-type') || '').toLowerCase();

      if (r.ok) {
        // success: parse if there is JSON, otherwise proceed
        if (ct.includes('application/json')) {
          const body = await r.json();
          // optional server message
        }

        setIsChangingPassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        Swal.fire({ icon: 'success', title: 'Password Changed', text: 'Your password has been updated.', confirmButtonText: 'OK', confirmButtonColor: '#0f766e' });
        return;
      }

      // non-OK response, try to extract message and include status
      let errMsg = '';
      if (ct.includes('application/json')) {
        const body = await r.json();
        errMsg = body?.message || JSON.stringify(body) || `${r.status} ${r.statusText}`;
      } else {
        const text = await r.text();
        errMsg = text || `${r.status} ${r.statusText}`;
      }

      throw new Error(errMsg || 'Unknown error');
    } catch (err) {
      const msg = err?.message || String(err) || 'Unable to change password';
      Swal.fire({ icon: 'error', title: 'Error', text: msg, confirmButtonText: 'OK', confirmButtonColor: '#0f766e' });
    } finally {
      setIsSubmittingPwd(false);
    }
  };

  // compute display name and initials for avatar
  const displayFirst = profileMeta?.firstName || formData.firstName || '';
  const displayLast = profileMeta?.lastName || formData.lastName || '';
  const displayName = (displayFirst || displayLast) ? `${displayFirst} ${displayLast}`.trim() : profileMeta?.username || 'Not set';
  const initials = ((displayFirst && displayFirst.charAt(0)) || (profileMeta?.username && profileMeta.username.charAt(0)) || '').toUpperCase() + ((displayLast && displayLast.charAt(0)) || (profileMeta?.username && profileMeta.username.charAt(1)) || '').toUpperCase();

  return (
    <div className="section">
      <div className="section-header">
        <h2>My Profile</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={() => setIsChangingPassword(true)}>Change Password</button>
          <button className="btn-primary" onClick={() => setIsEditing(true)}>Edit Profile</button>
        </div>
      </div>

      <div className="profile-container" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="profile-view">
            <div className="profile-card">
              <div className="profile-avatar" style={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '40px', 
                color: 'white', 
                fontWeight: 'bold',
                margin: '0 auto 20px'
              }}>
                {initials}
              </div>
              <div className="profile-info" style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h3 style={{ fontSize: '30px', marginBottom: '6px', fontWeight: 700, color: '#111827' }}>
                  {displayName}
                </h3>
                {profileMeta && (
                  <div style={{ marginTop: '8px', textAlign: 'center' }}>
                    <div style={{ marginTop: '6px', fontSize: '13px', color: '#6b7280' }}>
                      Username: <strong style={{ color: '#111827' }}>{profileMeta?.username || (sessionStorage.getItem('username') || localStorage.getItem('username')) || '—'}</strong>
                    </div>
                  </div>
                )}
              </div>
              <div className="profile-details" style={{ textAlign: 'left' }}>
                <div className="profile-field" style={{ marginBottom: '15px', padding: '15px', background: '#f9fafb', borderRadius: '8px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px', fontWeight: '600' }}>Username</label>
                  <p style={{ margin: 0, fontSize: '16px', color: '#111827' }}>{profileMeta?.username || 'Not provided'}</p>
                </div>

                <div className="profile-field" style={{ marginBottom: '15px', padding: '15px', background: '#f9fafb', borderRadius: '8px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px', fontWeight: '600' }}>Email *</label>
                  <p style={{ margin: 0, fontSize: '16px', color: formData.email || profileMeta?.email ? '#111827' : '#9ca3af' }}>{formData.email || profileMeta?.email || 'Not provided'}</p>
                </div>

                <div className="profile-field" style={{ marginBottom: '15px', padding: '15px', background: '#f9fafb', borderRadius: '8px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px', fontWeight: '600' }}>Company (Optional)</label>
                  <p style={{ margin: 0, fontSize: '16px', color: formData.company ? '#111827' : '#9ca3af' }}>{formData.company || 'Not provided'}</p>
                </div>
                <div className="profile-field" style={{ marginBottom: '15px', padding: '15px', background: '#f9fafb', borderRadius: '8px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px', fontWeight: '600' }}>Phone (Optional)</label>
                  <p style={{ margin: 0, fontSize: '16px', color: formData.phone ? '#111827' : '#9ca3af' }}>{formData.phone || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>
      </div>

      {isEditing && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Profile</h2>
              <button className="close-button" onClick={handleCancel}>×</button>
            </div>
            <div style={{ padding: '20px 30px 30px 30px' }}>
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name</label>
                    <div
                      role="textbox"
                      aria-readonly="true"
                      title="First name"
                      style={{ background: '#f3f4f6', padding: '12px 14px', borderRadius: '8px', color: '#111827', cursor: 'default' }}
                    >
                      {formData.firstName || 'Not provided'}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <div
                      role="textbox"
                      aria-readonly="true"
                      title="Last name"
                      style={{ background: '#f3f4f6', padding: '12px 14px', borderRadius: '8px', color: '#111827', cursor: 'default' }}
                    >
                      {formData.lastName || 'Not provided'}
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <div
                    role="textbox"
                    aria-readonly="true"
                    title="Email"
                    style={{ background: '#f3f4f6', padding: '12px 14px', borderRadius: '8px', color: '#111827', cursor: 'default' }}
                  >
                    {formData.email || 'Not provided'}
                  </div>
                </div>
                <div className="form-group">
                  <label>Company (Optional)</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Enter company name"
                  />
                </div>
                <div className="form-group">
                  <label>Phone (Optional)</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="modal-actions" style={{ marginTop: '20px' }}>
                  <button type="button" className="btn-secondary" onClick={handleCancel}>Cancel</button>
                  <button type="submit" className="btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isChangingPassword && (
        <div className="modal-overlay" onClick={() => setIsChangingPassword(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Change Password</h2>
              <button className="close-button" onClick={() => setIsChangingPassword(false)}>×</button>
            </div>
            <div style={{ padding: '20px 30px 30px 30px' }}>
              <form onSubmit={handleChangePassword}>
                <div className="form-group">
                  <label>Current Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => { setCurrentPassword(e.target.value); setShowCurrent(false); }}
                      style={{ paddingRight: '40px' }}
                    />
                    {currentPassword.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowCurrent((s) => !s)}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#6b7280'
                        }}
                        aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
                      >
                        {showCurrent ? <FaEye /> : <FaEyeSlash />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNew ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setShowNew(false); }}
                      style={{ paddingRight: '40px' }}
                      placeholder="At least 8 characters"
                    />
                    {newPassword.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowNew((s) => !s)}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#6b7280'
                        }}
                        aria-label={showNew ? 'Hide new password' : 'Show new password'}
                      >
                        {showNew ? <FaEye /> : <FaEyeSlash />}
                      </button>
                    )}
                  </div>

                  {/* strength indicator */}
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ width: `${passwordStrength.percent}%`, height: '100%', background: passwordStrength.color, transition: 'width 160ms ease' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                      <small style={{ color: passwordStrength.color, fontWeight: 600 }}>{passwordStrength.label || 'Enter a password'}</small>
                      <small style={{ color: '#6b7280' }}>{newPassword.length} chars</small>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setShowConfirm(false); }}
                      style={{ paddingRight: '40px' }}
                    />
                    {confirmPassword.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowConfirm((s) => !s)}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#6b7280'
                        }}
                        aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {showConfirm ? <FaEye /> : <FaEyeSlash />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="modal-actions" style={{ marginTop: '20px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsChangingPassword(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={isSubmittingPwd}>{isSubmittingPwd ? 'Updating…' : 'Update Password'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
