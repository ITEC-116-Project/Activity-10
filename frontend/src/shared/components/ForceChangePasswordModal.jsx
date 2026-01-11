import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { authService } from '../services/authService';

const ForceChangePasswordModal = ({ onClose }) => {
  const temp = sessionStorage.getItem('tempPassword') || '';
  const [currentPassword, setCurrentPassword] = useState(temp);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      Swal.fire({ icon: 'error', title: 'Invalid password', text: 'New password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      Swal.fire({ icon: 'error', title: 'Mismatch', text: 'New password and confirmation do not match.' });
      return;
    }

    try {
      setLoading(true);
      // send trimmed passwords to avoid accidental whitespace mismatch
      await authService.changePassword((currentPassword || '').trim(), (newPassword || '').trim());
      // clear flags
      sessionStorage.removeItem('requiresPasswordChange');
      sessionStorage.removeItem('tempPassword');
      Swal.fire({ icon: 'success', title: 'Password changed', text: 'Your password was updated successfully.' });
      onClose && onClose();
    } catch (err) {
      // If server rejected the current password, give a helpful hint
      const msg = err?.message || (err?.status === 401 ? 'Current password is incorrect' : 'Could not change password');
      Swal.fire({ icon: 'error', title: 'Failed', text: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Change Password</h2>
          <p>For security, please change your temporary password before continuing.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Current Temporary Password</label>
            <div style={{ position: 'relative' }}>
              <input className="input-with-icon" type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowCurrent((s) => !s)} className="input-icon" aria-label="Toggle current password visibility">
                {showCurrent ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>New Password</label>
            <div style={{ position: 'relative' }}>
              <input className="input-with-icon" type={showNew ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowNew((s) => !s)} className="input-icon" aria-label="Toggle new password visibility">
                {showNew ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
            <p style={{ marginTop: 8, color: '#6b7280', fontSize: 12 }}>Password must be at least 8 characters long.</p>
          </div>

          <div className="form-group">
            <label>Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input className="input-with-icon" type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowConfirm((s) => !s)} className="input-icon" aria-label="Toggle confirm password visibility">
                {showConfirm ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: 18 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Change Password'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForceChangePasswordModal;
