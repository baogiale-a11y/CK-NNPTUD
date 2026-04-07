import axios from 'axios';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' }
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh-token`,
            { refreshToken }
          );
          localStorage.setItem('accessToken', data.accessToken);
          err.config.headers.Authorization = `Bearer ${data.accessToken}`;
          return http(err.config);
        } catch (refreshErr) {
          localStorage.clear();
        }
      }
    }
    return Promise.reject(err);
  }
);

export default http;
