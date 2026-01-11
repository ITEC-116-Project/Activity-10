const API_BASE_URL = 'http://localhost:3000/announcements';

const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

const getHeaders = (includeAuth = true) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

export const announcementService = {
  // Get all active announcements (public)
  async getAll() {
    try {
      const response = await fetch(`${API_BASE_URL}`, {
        method: 'GET',
        headers: getHeaders(false),
      });
      if (!response.ok) throw new Error('Failed to fetch announcements');
      return await response.json();
    } catch (error) {
      console.error('Error fetching announcements:', error);
      return [];
    }
  },

  // Get announcement by ID
  async getById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'GET',
        headers: getHeaders(false),
      });
      if (!response.ok) throw new Error('Failed to fetch announcement');
      return await response.json();
    } catch (error) {
      console.error('Error fetching announcement:', error);
      return null;
    }
  },

  // Create announcement (organizer/admin only)
  async create(title, body) {
    try {
      const response = await fetch(`${API_BASE_URL}`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({
          title,
          body,
          isActive: true,
        }),
      });
      if (!response.ok) throw new Error('Failed to create announcement');
      return await response.json();
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
  },

  // Update announcement (organizer/admin only)
  async update(id, title, body, isActive) {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: getHeaders(true),
        body: JSON.stringify({
          title,
          body,
          isActive,
        }),
      });
      if (!response.ok) throw new Error('Failed to update announcement');
      return await response.json();
    } catch (error) {
      console.error('Error updating announcement:', error);
      throw error;
    }
  },

  // Delete announcement (organizer/admin only)
  async delete(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: getHeaders(true),
      });
      if (!response.ok) throw new Error('Failed to delete announcement');
      return await response.json();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      throw error;
    }
  },

  // Get announcements by admin ID
  async getByAdmin(adminId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/${adminId}`, {
        method: 'GET',
        headers: getHeaders(true),
      });
      if (!response.ok) throw new Error('Failed to fetch admin announcements');
      return await response.json();
    } catch (error) {
      console.error('Error fetching admin announcements:', error);
      return [];
    }
  },
};
