import axios from 'axios';

// Request interceptor to attach token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;

// Response interceptor to handle 401 Unauthorized errors automatically
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors (invalid or expired token)
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Clear invalid tokens
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Automatically authenticate with backend to get a fresh token
        const loginRes = await axios.post('/api/auth/login', {
          email: 'admin@erp.com',
          password: 'password123',
        });

        if (loginRes.data?.token) {
          const newToken = loginRes.data.token;
          localStorage.setItem('token', newToken);
          localStorage.setItem('user', JSON.stringify(loginRes.data.user));

          // Update header and retry the original failed request
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          isRefreshing = false;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        console.error('Automatic token refresh failed:', refreshError);
        isRefreshing = false;
        // If login completely fails, redirect to login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// Function to auto-authenticate on app load if no token exists or token is invalid
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
  } else {
    // Validate existing token against /api/auth/me
    try {
      await axios.get('/api/auth/me');
    } catch (err) {
      // Interceptor will automatically refresh if 401
    }
  }

  return localStorage.getItem('token');
};
