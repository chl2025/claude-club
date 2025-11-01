import axios from 'axios';

const API_BASE_URL = 'http://ubua.ainets.cc:5000/api';

console.log('🔍 API Service: Using base URL:', API_BASE_URL);

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request/response logging
api.interceptors.request.use(
  (config) => {
    console.log('🔍 API Request:', config.method?.toUpperCase(), config.url, config.data);
    return config;
  },
  (error) => {
    console.log('🔍 API Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('🔍 API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.log('🔍 API Response Error:', error.message);
    console.log('🔍 API Response Config:', error.config);
    console.log('🔍 API Response Code:', error.code);
    return Promise.reject(error);
  }
);

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  logout: () => api.post('/auth/logout'),
};

// Facilities API
export const facilitiesAPI = {
  getAll: (params) => api.get('/facilities', { params }),
  getTypes: () => api.get('/facilities/types'),
  getById: (id) => api.get(`/facilities/${id}`),
  getAvailability: (id, date) => api.get(`/facilities/${id}/availability`, { params: { date } }),
  getAvailableSlots: (id, date) => api.get(`/facilities/${id}/available-slots`, { params: { date } }),
  create: (facilityData) => api.post('/facilities', facilityData),
  update: (id, facilityData) => api.put(`/facilities/${id}`, facilityData),
  delete: (id) => api.delete(`/facilities/${id}`),
  updateStatus: (id, status) => api.put(`/facilities/${id}/status`, { status }),
  getUtilization: (params) => api.get('/facilities/admin/utilization', { params }),
};

// Bookings API
export const bookingsAPI = {
  create: (bookingData) => api.post('/bookings', bookingData),
  getAll: (params) => api.get('/bookings', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  cancel: (id) => api.delete(`/bookings/${id}`),
  getFacilityAvailability: (facilityId, date) =>
    api.get(`/bookings/facilities/${facilityId}/availability`, { params: { date } }),
  // Admin routes
  getAllBookings: (params) => api.get('/bookings/admin/all', { params }),
  updateStatus: (id, statusData) => api.put(`/bookings/${id}/status`, statusData),
  getStats: (params) => api.get('/bookings/admin/stats', { params }),
};

// Health check API
export const healthAPI = {
  check: () => api.get('/health'),
  checkDatabase: () => api.get('/health/db'),
};

export default api;