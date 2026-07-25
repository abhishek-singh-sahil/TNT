import axios from 'axios';

const API_BASE_URL = 'https://tnt-wdrm.onrender.com/api/v1';
// https://tnt-wdrm.onrender.com
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach bearer token if present in localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tnt_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified error formatting
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || 'Server communication error';
    return Promise.reject(new Error(message));
  }
);
