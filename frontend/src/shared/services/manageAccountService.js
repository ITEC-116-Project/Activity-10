import { authService } from './authService';

const API_URL = 'http://localhost:3000';

const buildHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = authService.getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.message || 'Request failed';
    throw new Error(message);
  }
  return data;
};

export const manageAccountService = {
  async listUsers() {
    const res = await fetch(`${API_URL}/manage-account`, {
      method: 'GET',
      headers: buildHeaders(),
    });
    return handleResponse(res);
  },

  async createUser(payload) {
    const res = await fetch(`${API_URL}/manage-account`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async updateUser(role, id, payload) {
    const res = await fetch(`${API_URL}/manage-account/${role}/${id}`, {
      method: 'PATCH',
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },
};
