const API_URL = 'http://localhost:3000';

export const authService = {
  async login(email, password) {
    const response = await fetch(`${API_URL}/account-login/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  },

  async signup(data) {
    const response = await fetch(`${API_URL}/account-login/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Signup failed');
    }

    return response.json();
  },

  async validateToken() {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const response = await fetch(`${API_URL}/account-login/validate`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      localStorage.clear();
      return null;
    }

    return response.json();
  },

  logout() {
    localStorage.clear();
  },

  getToken() {
    return localStorage.getItem('token');
  },

  getRole() {
    return localStorage.getItem('userRole');
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },
};
