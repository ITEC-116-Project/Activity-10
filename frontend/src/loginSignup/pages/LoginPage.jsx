import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../shared/services/authService';
import '../../loginSignup/styles/LoginPage.css';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    login: '', // email or username
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true); // keep logged in by default
  const navigate = useNavigate();

  // If already have a token in localStorage or sessionStorage, validate and redirect
  useEffect(() => {
    const autoRedirect = async () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) return;
      try {
        await authService.validateToken();
        const role = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');
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
        localStorage.clear();
        sessionStorage.clear();
      }
    };

    autoRedirect();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
        // Store token and user info in chosen storage
        const chosenStorage = remember ? localStorage : sessionStorage;
        chosenStorage.setItem('token', data.token);
        chosenStorage.setItem('userRole', data.role);
        chosenStorage.setItem('userId', data.userId);
        chosenStorage.setItem('username', data.username);
        chosenStorage.setItem('firstName', data.firstName);
        chosenStorage.setItem('lastName', data.lastName);

        // Navigate based on role
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

  return (
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
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>
          <div className="form-group remember-me">
            <input
              type="checkbox"
              id="remember"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <label htmlFor="remember">Remember me</label>
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
  );
};

export default LoginPage;
