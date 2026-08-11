import axios from 'axios';

// Axios request interceptor to attach Bearer token to all requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Function to auto-authenticate with default credentials if no token exists
export const ensureAuthenticated = async (): Promise<string | null> => {
  let token = localStorage.getItem('token');
  if (!token) {
    try {
      const response = await axios.post('/api/auth/login', {
        email: 'admin@erp.com',
        password: 'password123',
      });
      if (response.data?.token) {
        token = response.data.token;
        localStorage.setItem('token', token as string);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    } catch (error) {
      console.error('Auto-authentication failed:', error);
    }
  }
  return token;
};
