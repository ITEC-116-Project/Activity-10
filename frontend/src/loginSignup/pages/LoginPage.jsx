import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../shared/services/authService';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import '../../loginSignup/styles/LoginPage.css';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    login: '', // email or username
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [changeCurrentPassword, setChangeCurrentPassword] = useState('');
  const [changeNewPassword, setChangeNewPassword] = useState('');
  const [changeConfirmPassword, setChangeConfirmPassword] = useState('');
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeError, setChangeError] = useState('');
  const navigate = useNavigate();

  // If already have a token in localStorage or sessionStorage, validate and redirect
  useEffect(() => {
    const autoRedirect = async () => {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (!token) return;
      try {
        await authService.validateToken();
        const role = sessionStorage.getItem('userRole') || localStorage.getItem('userRole');
        console.log('[LoginPage] Auto-redirect - token exists, role:', role);
        switch (role) {
          case 'admin':
            navigate('/admin/dashboard');
            break;
          case 'organizer':
            navigate('/organizer/dashboard');
            break;
          case 'attendees':
            navigate('/attendees/dashboard');
            break;
          default:
            navigate('/');
        }
      } catch (err) {
        // invalid token — make sure storage is cleaned
        console.log('[LoginPage] Token validation failed, clearing storage');
        localStorage.clear();
        sessionStorage.clear();
      }
    };

    autoRedirect();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value
    });

    // If user types into password, hide the visible password for security
    if (name === 'password') setShowPassword(false);

    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/account-login/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        // Clear both storages to avoid conflicts with old data and store session-only values
        console.log('[LoginPage] Login successful - role:', data.role, 'userId:', data.userId);
        localStorage.clear();
        sessionStorage.clear();

        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('userRole', data.role);
        sessionStorage.setItem('userId', data.userId);
        sessionStorage.setItem('username', data.username);
        sessionStorage.setItem('firstName', data.firstName);
        sessionStorage.setItem('lastName', data.lastName);
        sessionStorage.setItem('email', data.email);

        console.log('[LoginPage] Storage set - userRole:', sessionStorage.getItem('userRole'));

        // If the account requires password change (temporary password), mark it and navigate first
        if (data.requiresPasswordChange) {
          try { sessionStorage.setItem('requiresPasswordChange', '1'); sessionStorage.setItem('tempPassword', formData.password); } catch {}
        }

        // Navigate based on role (user is now logged in)
        switch (data.role) {
          case 'admin':
            navigate('/admin/dashboard');
            break;
          case 'organizer':
            navigate('/organizer/dashboard');
            break;
          case 'attendees':
            navigate('/attendees/dashboard');
            break;
          default:
            navigate('/');
        }
      } else {
        setError(data.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const submitChangePassword = async (e) => {
    e.preventDefault();
    setChangeError('');
    if (!changeNewPassword || changeNewPassword.length < 8) {
      setChangeError('New password must be at least 8 characters long');
      return;
    }
    if (changeNewPassword !== changeConfirmPassword) {
      setChangeError('New password and confirmation do not match');
      return;
    }

    try {
      setChangeLoading(true);
      await authService.changePassword(changeCurrentPassword, changeNewPassword);
      setShowChangeModal(false);
      // After password changed, navigate to dashboard
      const role = sessionStorage.getItem('userRole') || localStorage.getItem('userRole');
      switch (role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'organizer':
          navigate('/organizer/dashboard');
          break;
        case 'attendees':
          navigate('/attendees/dashboard');
          break;
        default:
          navigate('/');
      }
    } catch (err) {
      setChangeError(err?.message || 'Failed to change password');
    } finally {
      setChangeLoading(false);
    }
  };

  return (
    <>
      <div className="login-container">
      <div className="login-card">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login">Email or Username</label>
            <input
              type="text"
              id="login"
              name="login"
              value={formData.login}
              onChange={handleChange}
              required
              placeholder="Enter your email or username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                style={{ paddingRight: '40px' }}
              />
              {formData.password.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
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
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
                </button>
              )}
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="signup-link">
          <p>Don't have an account? <a href="/signup">Sign up</a></p>
        </div>
      </div>
    </div>
        {/* Change Password Modal */}
        {showChangeModal && (
          <div className="modal-overlay" onClick={() => setShowChangeModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Change Password</h2>
              <form onSubmit={submitChangePassword}>
                <div className="form-group">
                  <label>Current Temporary Password</label>
                  <input type="password" value={changeCurrentPassword} onChange={(e) => setChangeCurrentPassword(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input type="password" value={changeNewPassword} onChange={(e) => setChangeNewPassword(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input type="password" value={changeConfirmPassword} onChange={(e) => setChangeConfirmPassword(e.target.value)} required />
                </div>
                {changeError && <div className="error-message">{changeError}</div>}
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowChangeModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={changeLoading}>{changeLoading ? 'Changing...' : 'Change Password'}</button>
                </div>
              </form>
            </div>
          </div>
  )}
    </>
  );
};

export default LoginPage;
